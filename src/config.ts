export type Config = {
    title: string,
    folder: string,
    dataKey: string,
    saveKey: string,
    smoothFactor: number,
    yOverride: {
        jurisdiction: string
    },
    smoothOverride: {
        jurisdiction: string
    },
    cumulative: boolean,
    scaleToHundred: boolean,
    chartWidth: number,
    chartHeight: number,
}
