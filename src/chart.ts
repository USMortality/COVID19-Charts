import { ChartConfiguration } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { dateString } from './common.js'

import { Series } from './series.js'
import { Slice } from './slice.js'

export function makeLines(
    slices: Slice[],
    trainingEnd?: number,
    trainingEndDate?: Date
): object[] {
    const lines = []
    const line = {
        type: 'line',
        xMin: 60,
        xMax: 60,
        borderColor: 'rgb(255, 0, 0)',
        borderWidth: 1,
        borderDash: [0, 0],
        label: {
            rotation: false,
            position: 'start',
            content: 'Peak',
            font: {
                size: 8
            },
            enabled: false
        }
    }

    let sliceCount = 1 // Used to not show last slice end line.
    slices.forEach(slice => {
        if (sliceCount++ < slices.length && slice.end) { // End
            line.xMin = slice.end
            line.xMax = slice.end
            line.borderDash = [0, 0]
            line.borderColor = 'rgb(0, 0, 0)'
            line.label.enabled = false
            lines.push(JSON.parse(JSON.stringify(line)))
        }
        if (slice.peak) { // Peak
            line.xMin = slice.peak
            line.xMax = slice.peak
            line.borderDash = [4, 4]
            line.borderColor = 'rgb(255, 0, 0)'
            if (slice.peakDate) {
                line.label.enabled = true
                line.label.content = 'Peak: ' + slice.peakValue + ' (' +
                    dateString(slice.peakDate) + ')'
            }
            lines.push(JSON.parse(JSON.stringify(line)))
        }
    })

    if (trainingEnd && trainingEndDate) {
        // Prediction end
        line.xMin = trainingEnd
        line.xMax = trainingEnd
        line.borderDash = [10, 10]
        line.borderColor = 'rgb(64, 64, 64)'
        line.label.enabled = true
        line.label.position = 'start'
        line.label.content = 'Prediction as of: ' + dateString(trainingEndDate)
        lines.push(JSON.parse(JSON.stringify(line)))
    }

    return lines
}

export type ChartConfig = {
    yMax: number,
    lines: object[],
    additionalDays: number,
    smoothFactor: number
}

export async function makeChart(
    series: Series,
    title: string,
    chartConfig: ChartConfig,
    // tslint:disable-next-line: no-unnecessary-initializer
    gompertzSeries: number[] = undefined

): Promise<Buffer> {
    const width = 600
    const height = 335
    const backgroundColour = 'white'
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width, height, backgroundColour, plugins: {
            modern: ['chartjs-plugin-annotation'],
        }
    })

    const labels = series.getLabels(chartConfig.additionalDays)
    const labelsExtended = labels

    const datasets = []
    if (gompertzSeries && gompertzSeries.length > 1) {
        datasets.push({
            label: `Gompertz Prediction`,
            data: gompertzSeries,
            borderColor: 'rgba(32, 32, 32, 100%)',
            fill: false,
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0.4,
        })
    }
    datasets.push({
        label: `Cases (7d AVG Smoothed ${chartConfig.smoothFactor}x)`,
        data: series.getNewCasesAvgSmooth(),
        borderColor: 'rgba(255, 71, 155, 100%)',
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
    })
    datasets.push({
        label: 'Cases (7d AVG)',
        data: series.getNewCasesAvg(),
        borderColor: ['rgba(43, 71, 155, 100%)'],
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
    })
    datasets.push({
        label: 'Cases',
        data: series.getNewCases(),
        borderColor: ['rgba(0, 255, 0, 100%)'],
        backgroundColor: 'rgba(0, 255, 0, 100%)',
        fill: false,
        borderWidth: 0,
        pointRadius: 1.5,
        tension: 0.4,
    })

    const configuration: ChartConfiguration = {
        type: 'line',
        data: {
            datasets,
            labels: labelsExtended
        },
        options: {
            responsive: true,
            devicePixelRatio: 2,
            plugins: {
                annotation: {
                    annotations: chartConfig.lines
                },
                title: {
                    display: true,
                    color: 'rgba(0, 0, 0, 100%)',
                    text: `COVID-19 Cases [${title}]`,
                    font: {
                        size: 18
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(0, 0, 0, 100%)',
                        font: {
                            weight: '200',
                            size: 12
                        }
                    },
                    usePointStyle: true,
                    pointStyle: 'cross'
                }
            } as any,
            scales: {
                x: {
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            weight: '200',
                            size: 11
                        },
                        color: 'rgba(120, 120, 120, 100%)',
                    },
                    ticks: {
                        font: {
                            weight: '200',
                            size: 10
                        },
                        color: 'rgba(0, 0, 0, 100%)',
                        callback: (value, index, values) => {
                            const date: Date = labelsExtended[index]
                            if (date.getDate() === 1) {
                                return `${date.getMonth() + 1}/` +
                                    `${date.getFullYear().toString()}`
                            }
                            return null
                        }
                    }
                },
                y: {
                    min: 0,
                    max: chartConfig.yMax,
                    title: {
                        display: true, text: 'Cases',
                        font: {
                            weight: '200',
                            size: 11
                        },
                        color: 'rgba(120, 120, 120, 100%)',
                    },
                    ticks: {
                        font: {
                            weight: '200',
                            size: 10
                        },
                        color: 'rgba(0, 0, 0, 100%)',
                    }
                }
            }
        },
        plugins: [],
    }
    return await chartJSNodeCanvas.renderToBuffer(configuration)
}
