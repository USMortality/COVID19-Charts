import { getSmoothedArrayMulti } from 'gauss-window'
import os from 'os'

import { fillerArray, fillerDateArray, getNumberLength, dateString } from './common.js'
import { Slice } from './slice.js'
import { appendFileSync } from 'fs'
import { Config } from './config.js'

export type Row = {
    date: Date,
    dataPoint: number
}

export class Series {
    private folder: string
    private jurisdiction: string
    private config: Config
    private smoothFactor: number

    private dates: Date[] = []
    private t: number[] = []
    private cases: number[] = []
    private newCases: number[]
    private newCasesAvg7: number[]
    private newCasesAvg7Smooth: number[]
    readonly newCasesLoess: number[]

    slices: Slice[]
    startPosition: number
    endPosition: number

    constructor(
        CONFIG: Config,
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
        rows.forEach(row => {
            this.t.push(i++)
            this.dates.push(row.date)
            this.cases.push(row.dataPoint)
        })

        this.newCases = this.dailyDiff(this.cases)
        this.newCasesAvg7 = this.calculateSevenDayAverage(this.getNewCases())

        this.startPosition = 0
        this.endPosition = rows.length - 1
    }

    private getSmoothFactor(country: string): number {
        const result = this.config.smoothOverride[country]
        if (result) return result
        else return this.config.smoothFactor
    }

    analyze(): void {
        this.newCasesAvg7Smooth = this.getNewCasesAvgSmoothed(this.smoothFactor)
    }

    analyzeSlices(): void {
        this.slices = this.findSlices()
    }

    logSlices(): void {
        if (!this.slices || !this.slices.length) return
        let result = ''
        for (const slice of this.slices) {
            if (slice.peak) {
                result += `"${this.jurisdiction}", "${dateString(slice.peakDate)}", "${slice.peakValue}"` + os.EOL
            }
        }
        appendFileSync(
            `./out/${this.config.saveKey}/${this.folder}/_slices.csv`,
            result
        )
    }

    private dailyDiff(values: number[]): number[] {
        return values.map((value: number, index: number, array: number[]) => {
            if (index === 0) return 0
            return array[index] - array[index - 1]
        })
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

    private findSlices(): Slice[] {
        const result = []

        let prev: number
        let next: number
        let maxCases = 0
        let currentSlice: Slice = new Slice()
        currentSlice.start = 0
        for (let i = 1; i < this.newCasesAvg7Smooth.length; i++) {
            const curr = this.newCasesAvg7Smooth[i]
            prev = this.newCasesAvg7Smooth[i - 1]
            next = this.newCasesAvg7Smooth[i + 1]

            // Skip first 0s
            if (curr === 0) {
                currentSlice.start = i + 1
                continue
            }
            if (this.newCasesAvg7[i] > maxCases) { // New local max
                maxCases = this.newCasesAvg7[i]
                currentSlice.peak = i
                currentSlice.peakDate = this.dates[i]
                currentSlice.peakValue = Math.round(this.newCasesAvg7[i])
                    .toLocaleString()
            }
            if (prev > curr && curr < next) { // New local minimum detected
                // Set end
                currentSlice.end = i

                result.push(currentSlice)
                currentSlice = new Slice()
                currentSlice.start = i

                // Reset max case counter
                maxCases = 0
            }
        }

        const max = this.newCases.length - 1

        // If nothing detected.
        if (currentSlice.start === max) currentSlice.start = 0

        // Last slice
        currentSlice.end = max
        result.push(currentSlice)

        return result
    }

    findYMax(): number {
        let yOverride
        try {
            yOverride = this.config.yOverride[this.jurisdiction]
        } catch (e) { }
        if (yOverride) return yOverride

        let result = 0
        this.getNewCasesAvg().forEach(element => {
            if (element > result) result = element
        })

        result *= 1.1 // Leave extra 10% room at the top.
        const magnitude = Math.floor(Math.log10(result))
        const base = Math.pow(10, (magnitude - 1))
        const chartHeight = Math.ceil(result / base) * base

        return isNaN(chartHeight) ? 100 : chartHeight
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

    getCases(): number[] {
        return this.cases
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
