import { mkdir, writeFile, writeFileSync } from 'fs'
import { promisify } from 'node:util'
import ProgressBar from 'progress'
import os from 'os'

import { loadData, saveImage, getNameFromKey, loadJson } from './common.js'
import { Series, Row } from './series.js'
import { ChartConfig, makeChart, makeLines } from './chart.js'
import { execSync } from 'child_process'

async function analyzeSeries(
    CONFIG: any,
    folder: string,
    jurisdiction: string,
    data: Map<string, Row[]>
): Promise<void> {
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
        title: getNameFromKey(jurisdiction),
        dataSource: (folder === 'us') ? 'nytimes.com' : 'ourworldindata.org'
    }
    const image = await makeChart(
        series, chartConfig
    )
    await saveImage(image, `./out/${folder}/${jurisdiction}.png`)
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
    CONFIG: any, folder: string, dataset: string,
    jurisdictionFilters: string[]
): Promise<void> {
    return new Promise(async (resolve) => {
        const rows: Map<string, Row[]> = await loadData(dataset)
        const barSize = (jurisdictionFilters ? jurisdictionFilters.length :
            undefined) || rows.size
        const bar = getProgressbar(`Processing "${folder}"`, barSize)

        const mkdirAsync = promisify(mkdir)
        await mkdirAsync(`./out/${folder}`, { recursive: true })
        writeFileSync(`./out/${folder}/_slices.csv`, '"state", "date_peak", "cases_peak"' + os.EOL)

        for (const [jurisdiction, _data] of rows) {
            if (!jurisdictionFilters ||
                jurisdictionFilters.indexOf(jurisdiction) > -1) {
                await analyzeSeries(CONFIG, folder, jurisdiction, rows)
                bar.tick(1)
            }
        }
        resolve()
    })
}

function getFilters(): string[] | undefined {
    const input = process.argv[3]
    return input ? JSON.parse(input) : undefined
}

async function main(): Promise<void> {
    const CONFIG: any = await loadJson('config.json')

    const folder = process.argv[2]
    const jurisdictionFilters: string[] = getFilters()
    console.log(`Filter: ${folder}, ${jurisdictionFilters}`)

    execSync(`rm -rf ./out/*`)

    if (!folder || folder === 'us') {
        await processJurisdictions(CONFIG, 'us', './data/us.csv',
            jurisdictionFilters)
    }
    if (!folder || folder === 'world') {
        await processJurisdictions(CONFIG, 'world', './data/world.csv',
            jurisdictionFilters)
    }

    console.log('Compressing images...')
    execSync('pngquant ./out/*/*.png --ext=.png --force')

    console.log('Done.')
}

main()