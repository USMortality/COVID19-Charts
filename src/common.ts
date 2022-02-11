import * as csvtojson from 'csvtojson'
import { readFile, writeFile } from 'fs'
import { promisify } from 'node:util'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream'
import fetch from 'node-fetch'

import { Row } from './series.js'
import { Slice } from './slice.js'

// tslint:disable-next-line: no-unnecessary-initializer
export function fillerArray(end: number, filler: any = undefined): number[] {
    const result = []
    for (let i = 0; i < end; i++) result.push(filler)
    return result
}

export function fillerDateArray(fromDate: Date, end: number): Date[] {
    const result = []
    const start = fromDate
    for (let i = 0; i < end; i++) result.push(addDays(start, i))
    return result
}

export function getKey(jurisdiction: string): string {
    return capitalizeFirstLetters(jurisdiction).replace(/[\W]+/g, '_')
        .toLowerCase()
}

export function getNameFromKey(key: string): string {
    return capitalizeFirstLetters(key.replace(/_/g, ' '))
}

export function addDays(date: Date, days: number): Date {
    const newDate = new Date(date.valueOf())
    newDate.setDate(newDate.getDate() + days)
    return newDate
}

export function saveImage(image: Buffer, filename: string): Promise<void> {
    const writeFileAsync = promisify(writeFile)
    return writeFileAsync(filename, image, 'base64')
}

export function getNumberLength(val: number): number {
    return val.toString().length
}

export async function loadJson(filename: string): Promise<object> {
    return new Promise((resolve, reject) => {
        readFile(filename, { encoding: 'utf-8' }, (err, data) => {
            if (err || !data) reject(err)
            try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
        })
    })
}

export async function loadData(filename: string): Promise<Map<string, Row[]>> {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await csvtojson
                .default({ delimiter: ',' })
                .fromFile(filename)
                .then(async (datas: any) => processCsvRows(datas)))
        } catch (e) {
            console.log('Error loading file, did you run `npm run update`?')
            reject(e)
        }
    })
}

function shouldProcess(data): boolean {
    if (data.iso_code) { // world dataset
        if (data.iso_code.startsWith('OWID')) return false
        if (parseInt(data.population, 10) < 1000000) return false
    }
    return true
}

export async function processCsvRows(datas: any): Promise<Map<string, Row[]>> {
    const result: Map<string, Row[]> = new Map()
    for await (const data of datas) {
        if (!shouldProcess(data)) continue

        const jurisdiction = data.state || data.location
        if (!jurisdiction) continue

        const row: Row = {
            date: new Date(data.date),
            cases: parseInt((data.cases) ?
                data.cases : data.total_cases, 10),
            positiveRate: data.positive_rate ? data.positive_rate : undefined
        }

        const key = getKey(jurisdiction)
        let arr: Row[] | undefined = result.get(key)
        if (!arr) {
            arr = []
            result.set(key, arr)
        }
        arr.push(row)
    }
    return result
}

export async function loadSlices(
    folder: string, jurisdiction: string
): Promise<Slice[]> {
    return new Promise((resolve, reject) => {
        readFile(`./out/${folder}/${jurisdiction}/slices.json`,
            { encoding: 'utf-8' }, (err, data) => {
                if (err || !data) reject(err)
                try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
            })
    })
}

export function capitalizeFirstLetters(str: string): string {
    return str.toLowerCase().replace(/^\w|\s\w/g, (letter) => {
        return letter.toUpperCase()
    })
}

export async function download(urlString: string, file: string): Promise<void> {
    const streamPipeline = promisify(pipeline)
    const response = await fetch(urlString)
    if (!response.ok) {
        throw new Error(`unexpected response ${response.statusText}`)
    }
    await streamPipeline(response.body, createWriteStream(file))
}

export function dateString(date: Date): string {
    return date.toLocaleDateString('en-US', { timeZone: 'UTC' })
}