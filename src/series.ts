import { getSmoothedArrayMulti } from 'gauss-window'
import lowess from '@stdlib/stats-lowess'
import os from 'os'

import { fillerArray, fillerDateArray, getNumberLength, dateString } from './common.js'
import { Slice } from './slice.js'
import { appendFileSync } from 'fs'

export type Row = {
    date: Date,
    cases: number,
    positiveRate: number
}

export class Series {
    private folder: string
    private jurisdiction: string
    private config: object
    private smoothFactor: number

    private dates: Date[] = []
    private t: number[] = []
    private cases: number[] = []
    private newCases: number[]
    private positiveRate: number[] = []
    private newCasesAvg7: number[]
    private newCasesAvg7Smooth: number[]
    readonly newCasesLoess: number[]

    slices: Slice[]
    startPosition: number
    endPosition: number

    constructor(
        CONFIG: object,
        folder: string,
        jurisdiction: string,
    ) {
        this.config = CONFIG
        this.smoothFactor = this.getSmoothFactor(jurisdiction)
        this.folder = folder
        this.jurisdiction = jurisdiction
    }

    async loadData(rows: Row[]): Promise<void> {
        let i = 0
        rows.forEach(element => {
            this.t.push(i++)
            this.dates.push(element.date)
            this.cases.push(element.cases)
            this.positiveRate.push(element.positiveRate)
        })

        this.newCases = this.dailyDiff(this.cases)
        this.newCasesAvg7 = this.calculateSevenDayAverage(this.getNewCases())

        this.startPosition = 0
        this.endPosition = rows.length - 1
    }

    private getSmoothFactor(country: string): number {
        const override = this.config['smoothOverride'][country]
        const result = override ? override : this.config['smoothFactor']
        return result
    }

    getLoess(t: number[], values: number[], smoothFactor: number): number[] {
        return lowess(t, values, { 'f': smoothFactor }).y
    }

    analyze(): void {
        this.newCasesAvg7Smooth = this.getNewCasesAvgSmoothed(this.smoothFactor)
    }

    analyzeSlices(): void {
        this.slices = this.findSlices()
    }

    logSlices(): void {
        if (!this.slices || !this.slices.length) return
        let result = ""
        for (const slice of this.slices) {
            if (slice.peak) {
                result += `"${this.jurisdiction}", "${dateString(slice.peakDate)}", "${slice.peakValue}"` + os.EOL
            }
        }
        appendFileSync(`./out/${this.folder}/slices.csv`, result)
    }

    private dailyDiff(values: number[]): number[] {
        return values.map((value: number, index: number, array: number[]) => {
            if (index === 0) return 0
            return array[index] - array[index - 1]
        })
    }

    private findStartPosition(series: number[]): number {
        for (let i = 0; i < series.length; i++) {
            if (series[i] >= 1) return i
        }

        return 0
    }

    private calculateSevenDayAverage(series: number[]): number[] {
        const result: number[] = fillerArray(3)
        for (let i = 3; i < series.length - 3; i++) {
            const slice: number[] = series.slice(i - 3, i + 3)
            const avg = slice.reduce((prev: number, curr: number) => {
                return prev + curr
            }) / 7
            result.push(avg)
        }
        return result.concat(fillerArray(3))
    }

    private getNewCasesAvgSmoothed(factor: number): number[] {
        const slicedArray = this.getNewCasesAvg().slice(3, -3)
        const smoothedArray = getSmoothedArrayMulti(slicedArray, factor, 3, 1)
        return fillerArray(3).concat(smoothedArray)
    }

    private findMinimaN(data: number[]): number {
        let minima = 0
        let prev: number
        let next: number
        for (let i = 1; i < data.length; i++) {
            const curr = data[i]
            prev = data[i - 1]
            next = data[i + 1]

            if (prev > curr && curr < next) minima++
        }
        return minima
    }

    private findSlices(): Slice[] {
        const key = 'newCasesAvg7Smooth'
        const keyRaw = 'newCasesAvg7'
        const result = []

        let prev: number
        let next: number
        let maxCases = 0
        let currentSlice: Slice = new Slice()
        currentSlice.start = 0
        for (let i = 1; i < this[key].length; i++) {
            const curr = this[key][i]
            prev = this[key][i - 1]
            next = this[key][i + 1]

            // Skip first 0s
            if (curr === 0) {
                currentSlice.start = i + 1
                continue
            }
            if (this[keyRaw][i] > maxCases) { // New local max
                maxCases = this[keyRaw][i]
                currentSlice.peak = i
                currentSlice.peakDate = this.dates[i]
                currentSlice.peakValue = Math.round(this[keyRaw][i])
                    .toLocaleString()
            }
            if (prev > curr && curr < next) { // New local minimum detected
                // Set end
                currentSlice.end = i

                // Set smooth factor
                currentSlice.setSmoothFactor(this[key].length)
                result.push(currentSlice)
                currentSlice = new Slice()
                currentSlice.start = i

                // Reset case counter
                maxCases = 0
            }
        }

        const max = this.newCases.length - 1

        // If nothing detected.
        if (currentSlice.start === max) currentSlice.start = 0

        // Last slice
        currentSlice.end = max
        currentSlice.setSmoothFactor(this[key].length)
        result.push(currentSlice)

        return result
    }

    findYMax(): number {
        const yOverride = this.config['yOverride'][this.jurisdiction]
        if (yOverride) return yOverride

        let result = 0
        this.getNewCasesAvg().forEach(element => {
            if (element > result) result = element
        })

        const lenAbs = getNumberLength(Math.round(result))
        const lenCalc = Math.pow(10, lenAbs - 1)
        const a = Math.ceil(result / lenCalc)

        return Math.round(a * Math.pow(10, lenAbs - 1)) * 2
    }

    getDate(index: number): Date {
        return this.dates[index]
    }

    private getSlicedData(values: any[]): any[] {
        return values.slice(this.startPosition, this.endPosition)
    }

    getLastDate(): Date {
        return this.dates[this.dates.length - 1]
    }

    getLabels(additionalDays: number): Date[] {
        const additionalLabels = fillerDateArray(
            this.getLastDate(), additionalDays
        )
        return this.dates.concat(additionalLabels)
    }

    getNewCases(): number[] {
        return this.newCases
    }

    getNewCasesAvg(): number[] {
        return this.newCasesAvg7
    }

    getNewCasesAvgSmooth(): number[] {
        return this.newCasesAvg7Smooth
    }

    getLabelsSliced(): Date[] {
        return this.getSlicedData(this.dates)
    }

    getTSliced(): number[] {
        return this.getSlicedData(this.t)
    }

    getNewCasesSliced(): number[] {
        return this.getSlicedData(this.newCases)
    }

    getNewCasesAvgSliced(): number[] {
        return this.getSlicedData(this.newCasesAvg7)
    }

    getNewCasesAvgSmoothSliced(): number[] {
        return this.getSlicedData(this.newCasesAvg7Smooth)
    }
}
