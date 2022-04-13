import { mkdir } from 'fs'
import { execSync } from 'child_process'
import { promisify } from 'node:util'

import { loadData, loadJson } from './common.js'

const mkdirAsync = promisify(mkdir)

async function countries(vaccinated: object): Promise<void> {
    const locations: string[] = await loadJson('countries.json') as string[]

    mkdirAsync(`./out/world`, { recursive: true })
    locations.forEach(location => {
        try {
            const imagePath1 =
                `./out/covid_cases_million/world/${location}.png`.toString()
            const imagePath2 =
                `./out/icu_patients_million/world/${location}.png`.toString()
            const imagePath3 =
                `./out/hosp_patients_million/world/${location}.png`.toString()
            const imagePath4 =
                `./out/covid_deaths_million/world/${location}.png`.toString()

            execSync(`convert \\( ${imagePath1} -resize 960x ${imagePath2} -resize 960x -append \\) ` +
                `\\( ${imagePath3} -resize 960x ${imagePath4} -resize 960x -append \\) ` +
                `+append ` +
                `-pointsize 24 ` +
                `-fill red ` +
                `-gravity center ` +
                `-draw "text 480,270 'Vaccinated (Fully): ${vaccinated[location]}%'" ` +
                ` ./out/world/${location}.png `
            )
        } catch (e) { console.log(e) }
    })
}

async function countries2(vaccinated: object): Promise<void> {
    const locations: string[] = await loadJson('countries.json') as string[]

    mkdirAsync(`./out/world2`, { recursive: true })
    locations.forEach(location => {
        try {
            const imagePath1 =
                `./out/covid_cases_million/world/${location}.png`.toString()
            const imagePath2 =
                `./out/total_tests_thousand/world/${location}.png`.toString()
            const imagePath3 =
                `./out/covid_deaths_million/world/${location}.png`.toString()
            const imagePath4 =
                `./out/excess_mortality_cumulative_million/world/${location}.png`.toString()

            execSync(`convert \\( ${imagePath1} -resize 960x ${imagePath2} -resize 960x -append \\) ` +
                `\\( ${imagePath3} -resize 960x ${imagePath4} -resize 960x -append \\) ` +
                `+append ` +
                `-pointsize 24 ` +
                `-fill red ` +
                `-gravity center ` +
                `-draw "text 480,270 'Vaccinated (Fully): ${vaccinated[location]}%'" ` +
                ` ./out/world2/${location}.png `
            )
        } catch (e) { console.log(e) }
    })
}

async function countries3(vaccinated: object): Promise<void> {
    const locations: string[] = await loadJson('countries.json') as string[]

    mkdirAsync(`./out/world3`, { recursive: true })
    locations.forEach(location => {
        try {
            const imagePath1 =
                `./out/covid_deaths_million/world/${location}.png`.toString()
            const imagePath2 =
                `./out/excess_mortality_cumulative_million/world/${location}.png`.toString()
            const imagePath3 =
                `./out/stringency_index/world/${location}.png`.toString()
            const imagePath4 = `./out/total_vaccinations_hundred/world/${location}.png`
                .toString()

            execSync(`convert \\( ${imagePath1} -resize 960x ${imagePath2} -resize 960x -append \\) ` +
                `\\( ${imagePath3} -resize 960x ${imagePath4} -resize 960x -append \\) ` +
                `+append ` +
                `-pointsize 24 ` +
                `-fill red ` +
                `-gravity center ` +
                `-draw "text 480,270 'Vaccinated (Fully): ${vaccinated[location]}%'" ` +
                ` ./out/world3/${location}.png `
            )
        } catch (e) { console.log(e) }
    })
}

async function countries4(vaccinated: object): Promise<void> {
    const locations: string[] = await loadJson('countries.json') as string[]

    mkdirAsync(`./out/world4`, { recursive: true })
    locations.forEach(location => {
        try {
            const imagePath1 =
                `./out/covid_cases_million/world/${location}.png`.toString()
            const imagePath2 =
                `./out/hosp_patients_million/world/${location}.png`.toString()
            const imagePath3 =
                `./out/icu_patients_million/world/${location}.png`.toString()
            const imagePath4 =
                `./out/covid_deaths_million/world/${location}.png`.toString()
            const imagePath5 = `./out/total_vaccinations_hundred/world/${location}.png`
                .toString()
            const imagePath6 =
                `./out/total_tests_thousand/world/${location}.png`.toString()
            const imagePath7 =
                `./out/excess_mortality_cumulative_million/world/${location}.png`.toString()
            const imagePath8 = `./out/vaccinated_2_per_hundred/world/${location}.png`
                .toString()
            const imagePath9 =
                `./out/stringency_index/world/${location}.png`.toString()

            execSync(`convert \\( ${imagePath1} -resize 640x ${imagePath4} -resize 640x ${imagePath7} -resize 640x -append \\) ` +
                `\\( ${imagePath2} -resize 640x ${imagePath5} -resize 640x ${imagePath8} -resize 640x -append \\) ` +
                `\\( ${imagePath3} -resize 640x ${imagePath6} -resize 640x ${imagePath9} -resize 640x -append \\) ` +
                `+append ` +
                ` ./out/world4/${location}.png `
            )
        } catch (e) { console.log(e) }
    })
}

async function states(): Promise<void> {
    const locations: string[] = await loadJson('states.json') as string[]

    mkdirAsync(`./out/us`, { recursive: true })
    locations.forEach(location => {
        try {
            const imagePath1 =
                `./out/covid_cases/us/${location}.png`.toString()
            const imagePath2 =
                `./out/covid_deaths/us/${location}.png`.toString()
            execSync(`convert \\( ${imagePath1} -resize 960x ${imagePath2} -resize 960x -append \\) ` +
                `+append ./out/us/${location}.png`
            )
        } catch (e) { console.log(e) }
    })
}

async function main(): Promise<void> {
    const datas = await loadData(
        './data/world.csv',
        'people_fully_vaccinated_per_hundred',
        'float'
    )

    // Get latest value
    const vaccinated = {}
    for await (const data of datas) {
        const key = data[0]
        const value = data[1][data[1].length - 1]
        vaccinated[key] = value.dataPoint
    }

    console.log('Stitching images...')

    await countries(vaccinated)
    console.log('Creating thumbnail images...')
    let imagePath = `./out/world/*.png`
    let thumbPath = `./out/world/thumbs`
    await mkdirAsync(thumbPath, { recursive: true })
    execSync(`mogrify -path ${thumbPath} -thumbnail 360x ${imagePath}`)
    console.log('Compressing images...')
    execSync(`pngquant ${imagePath} --ext=.png --force`)
    execSync(`pngquant ${thumbPath}/*.png --ext=.png --force`)

    await countries2(vaccinated)
    console.log('Creating thumbnail images...')
    imagePath = `./out/world2/*.png`
    thumbPath = `./out/world2/thumbs`
    await mkdirAsync(thumbPath, { recursive: true })
    execSync(`mogrify -path ${thumbPath} -thumbnail 360x ${imagePath}`)
    console.log('Compressing images...')
    execSync(`pngquant ${imagePath} --ext=.png --force`)
    execSync(`pngquant ${thumbPath}/*.png --ext=.png --force`)

    await countries3(vaccinated)
    console.log('Creating thumbnail images...')
    imagePath = `./out/world3/*.png`
    thumbPath = `./out/world3/thumbs`
    await mkdirAsync(thumbPath, { recursive: true })
    execSync(`mogrify -path ${thumbPath} -thumbnail 360x ${imagePath}`)
    console.log('Compressing images...')
    execSync(`pngquant ${imagePath} --ext=.png --force`)
    execSync(`pngquant ${thumbPath}/*.png --ext=.png --force`)

    await countries4(vaccinated)
    console.log('Creating thumbnail images...')
    imagePath = `./out/world4/*.png`
    thumbPath = `./out/world4/thumbs`
    await mkdirAsync(thumbPath, { recursive: true })
    execSync(`mogrify -path ${thumbPath} -thumbnail 360x ${imagePath}`)
    console.log('Compressing images...')
    execSync(`pngquant ${imagePath} --ext=.png --force`)
    execSync(`pngquant ${thumbPath}/*.png --ext=.png --force`)

    await states()
    console.log('Creating thumbnail images...')
    thumbPath = `./out/us/thumbs`
    await mkdirAsync(thumbPath, { recursive: true })
    imagePath = `./out/us/*.png`
    execSync(`mogrify -path ${thumbPath} -thumbnail 360x ${imagePath}`)
    console.log('Compressing images...')
    execSync(`pngquant ./out/us/*.png --ext=.png --force`)

    console.log('Done.')
}

main()
