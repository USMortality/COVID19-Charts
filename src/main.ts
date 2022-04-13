import { mkdir, writeFileSync } from 'fs'
import { promisify } from 'node:util'
import ProgressBar from 'progress'
import os from 'os'

import { loadData, saveImage, getNameFromKey, loadJson } from './common.js'
import { Series, Row } from './series.js'
import { ChartConfig, makeChart, makeLines } from './chart.js'
import { execSync } from 'child_process'
import { Config } from './config.js'

const mkdirAsync = promisify(mkdir)

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
        lines: CONFIG.cumulative ? undefined : lines,
        additionalDays: 0,
        smoothFactor: CONFIG.smoothFactor,
        dataSourceTitle: CONFIG.title,
        cumulative: CONFIG.cumulative,
        title: getNameFromKey(jurisdiction),
        dataSource: (folder === 'us') ? 'nytimes.com' : 'ourworldindata.org',
        scaleToHundred: CONFIG.scaleToHundred,
        width: CONFIG.chartWidth,
        height: CONFIG.chartHeight,
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
    dataset: string,
    jurisdictionFilters: string[]
): Promise<void> {
    return new Promise(async (resolve) => {
        const rows: Map<string, Row[]> = await loadData(dataset, CONFIG.dataKey)
        const barSize = (jurisdictionFilters ? jurisdictionFilters.length :
            undefined) || rows.size
        const bar = getProgressbar(`Processing "${CONFIG.folder}"`, barSize)

        await mkdirAsync(`./out/${CONFIG.saveKey}/${CONFIG.folder}`, {
            recursive: true
        })
        writeFileSync(`./out/${CONFIG.saveKey}/${CONFIG.folder}/_slices.csv`,
            '"state", "date_peak", "cases_peak"' + os.EOL)

        for (const [jurisdiction, _data] of rows) {
            if (!jurisdictionFilters ||
                jurisdictionFilters.indexOf(jurisdiction) > -1) {
                const image = await analyzeSeries(
                    CONFIG, CONFIG.folder, jurisdiction, rows
                )
                await saveImage(image, `./out/${CONFIG.saveKey}/` +
                    `${CONFIG.folder}/${jurisdiction}.png`
                )
                bar.tick(1)
            }
        }
        resolve()
    })
}

function getFilters(input: string): string[] | undefined {
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
        smoothOverride: config.smoothOverride,
        cumulative: JSON.parse(process.argv[6]) || false,
        scaleToHundred: JSON.parse(process.argv[7]) || false,
        chartWidth: config.chartWidth,
        chartHeight: config.chartHeight,
    }

    return result
}

async function main(): Promise<void> {
    const CONFIG: Config = await loadConfig()

    const jurisdictionFilters: string[] = getFilters(process.argv[8])
    console.log(`Config: ${JSON.stringify(CONFIG, null, 2)}, `
        + `Filter: ${CONFIG.folder}, ${jurisdictionFilters}`)

    execSync(`rm -rf ./out/${CONFIG.saveKey}/${CONFIG.folder}/*`)

    if (!CONFIG.folder || CONFIG.folder === 'us') {
        await processJurisdictions(CONFIG, './data/us.csv',
            jurisdictionFilters)
    }
    if (!CONFIG.folder || CONFIG.folder === 'world') {
        await processJurisdictions(CONFIG, './data/world.csv',
            jurisdictionFilters)
    }

    console.log('Creating thumbnail images...')
    const thumbPath = `./out/${CONFIG.saveKey}/${CONFIG.folder}/thumbs`
    await mkdirAsync(thumbPath, { recursive: true })
    const imagePath = `./out/${CONFIG.saveKey}/${CONFIG.folder}/*.png`
    execSync(`mogrify -path ${thumbPath} -thumbnail 360x ${imagePath}`)
    console.log('Compressing images...')
    execSync(`pngquant ./out/${CONFIG.saveKey}/**/*.png --ext=.png --force`)

    console.log('Done.')
}

main()