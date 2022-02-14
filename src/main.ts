import { mkdir, writeFileSync } from 'fs'
import { promisify } from 'node:util'
import ProgressBar from 'progress'
import os from 'os'

import { loadData, saveImage, getNameFromKey, loadJson } from './common.js'
import { Series, Row } from './series.js'
import { ChartConfig, makeChart, makeLines } from './chart.js'
import { execSync } from 'child_process'
import { Config } from './config.js'

async function analyzeSeries(
    CONFIG: Config,
    folder: string,
    jurisdiction: string,
    data: Map<string, Row[]>
): Promise<Buffer> {
    const rows = data.get(jurisdiction)
    const series: Series = new Series(CONFIG, folder, jurisdiction)
    series.loadData(rows)
    series.analyze()
    series.analyzeSlices()
    series.logSlices()

    const lines: object[] = makeLines(series.slices)
    const chartConfig: ChartConfig = {
        yMax: series.findYMax(),
        lines,
        additionalDays: 0,
        smoothFactor: CONFIG.smoothFactor,
        dataSourceTitle: CONFIG.title,
        title: getNameFromKey(jurisdiction),
        dataSource: (folder === 'us') ? 'nytimes.com' : 'ourworldindata.org'
    }
    return await makeChart(series, chartConfig)
}

function getProgressbar(title: string, total: number): ProgressBar {
    return new ProgressBar(`${title} [:bar] :current/:total :percent :etas`, {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total
    })
}

async function processJurisdictions(
    CONFIG: Config,
    folder: string,
    dataset: string,
    jurisdictionFilters: string[]
): Promise<void> {
    return new Promise(async (resolve) => {
        const rows: Map<string, Row[]> = await loadData(dataset, CONFIG.dataKey)
        const barSize = (jurisdictionFilters ? jurisdictionFilters.length :
            undefined) || rows.size
        const bar = getProgressbar(`Processing "${folder}"`, barSize)

        const mkdirAsync = promisify(mkdir)
        await mkdirAsync(`./out/${CONFIG.saveKey}/${folder}`, {
            recursive: true
        })
        writeFileSync(`./out/${CONFIG.saveKey}/${folder}/_slices.csv`,
            '"state", "date_peak", "cases_peak"' + os.EOL)

        for (const [jurisdiction, _data] of rows) {
            if (!jurisdictionFilters ||
                jurisdictionFilters.indexOf(jurisdiction) > -1) {
                const image =
                    await analyzeSeries(CONFIG, folder, jurisdiction, rows)
                await saveImage(image,
                    `./out/${CONFIG.saveKey}/${folder}/${jurisdiction}.png`
                )
                bar.tick(1)
            }
        }
        resolve()
    })
}

function getFilters(): string[] | undefined {
    const input = process.argv[6]
    return input ? JSON.parse(input) : undefined
}

async function loadConfig(): Promise<Config> {
    const config: any = await loadJson('config.json')
    const result = {
        title: process.argv[5],
        folder: process.argv[2],
        dataKey: process.argv[3],
        saveKey: process.argv[4],
        smoothFactor: config.smoothFactor,
        yOverride: config.yOverride,
        smoothOverride: config.smoothOverride
    }

    return result
}

async function main(): Promise<void> {
    const CONFIG: Config = await loadConfig()

    const jurisdictionFilters: string[] = getFilters()
    console.log(`Config: ${JSON.stringify(CONFIG, null, 2)}, `
        + `Filter: ${CONFIG.folder}, ${jurisdictionFilters}`)

    execSync(`rm -rf ./out/${CONFIG.saveKey}/${CONFIG.folder}/*`)

    if (!CONFIG.folder || CONFIG.folder === 'us') {
        await processJurisdictions(CONFIG, 'us', './data/us.csv',
            jurisdictionFilters)
    }
    if (!CONFIG.folder || CONFIG.folder === 'world') {
        await processJurisdictions(CONFIG, 'world', './data/world.csv',
            jurisdictionFilters)
    }

    console.log('Compressing images...')
    execSync(`pngquant ./out/${CONFIG.saveKey}/**/*.png --ext=.png --force`)

    console.log('Done.')
}

main()