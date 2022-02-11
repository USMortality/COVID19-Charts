export class Slice {
    start: number
    end: number
    peak: number
    peakDate: Date
    peakValue: string
    smoothFactor: number

    setSmoothFactor(allDataLength: number): void {
        const sliceLength = this.end - this.start
        this.smoothFactor = 1 / (sliceLength * 20 / allDataLength)
    }
}