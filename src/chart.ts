import { ChartConfiguration } from 'chart.js'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { dateString } from './common.js'

import { Series } from './series.js'
import { Slice } from './slice.js'

export type ChartConfig = {
    title: string,
    dataSource: string,
    dataSourceTitle: string,
    yMax: number,
    cumulative: boolean,
    lines: object[],
    additionalDays: number,
    smoothFactor: number,
    scaleToHundred: boolean,
    width: number,
    height: number,
}

export function makeLines(slices: Slice[]): object[] {
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
                size: 10
            },
            enabled: false
        }
    }

    slices.forEach(slice => {
        if (slice.peak) { // Peak
            line.xMin = slice.peak
            line.xMax = slice.peak
            line.borderDash = [2, 4]
            line.borderColor = '#A538FF'
            if (slice.peakDate) {
                line.label.enabled = true
                line.label.content = slice.peakValue + ' (' +
                    dateString(slice.peakDate) + ')'
            }
            lines.push(JSON.parse(JSON.stringify(line)))
        }
    })

    return lines
}

function getYMax(chartConfig: ChartConfig): number {
    if (chartConfig.scaleToHundred) return 100
    return !chartConfig.cumulative ? chartConfig.yMax : undefined
}

export async function makeChart(
    series: Series,
    chartConfig: ChartConfig
): Promise<Buffer> {
    const width = chartConfig.width
    const height = chartConfig.height
    const backgroundColour = '#ffffff'
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width, height, backgroundColour, plugins: {
            modern: ['chartjs-plugin-annotation'],
        }
    })

    const labels = series.getLabels(chartConfig.additionalDays)
    const labelsExtended = labels

    const datasets = []
    if (!chartConfig.cumulative) {
        datasets.push({
            label: `${chartConfig.dataSourceTitle} (7d AVG Smoothed ${chartConfig.smoothFactor}x)`,
            data: series.getNewCasesAvgSmooth(),
            borderColor: '#000000',
            fill: false,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
        })
        datasets.push({
            label: `${chartConfig.dataSourceTitle} (Centered 7d AVG)`,
            data: series.getNewCasesAvg(),
            borderColor: '#4646FF',
            fill: false,
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
        })
        datasets.push({
            label: chartConfig.dataSourceTitle,
            data: series.getNewCases(),
            backgroundColor: '#38A1FF',
            fill: false,
            borderWidth: 0,
            pointRadius: 1,
            tension: 0.4,
        })
    } else {
        datasets.push({
            label: chartConfig.dataSourceTitle,
            data: series.getCases(),
            borderColor: '#000000',
            fill: false,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
        })
    }

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
                    text: `${chartConfig.dataSourceTitle} [${chartConfig.title}]`,
                    font: {
                        size: 18
                    }
                },
                subtitle: {
                    display: true,
                    color: 'rgba(50, 50, 50, 100%)',
                    text: `Datasource: ${chartConfig.dataSource}; ` +
                        `Generated: ${dateString(new Date())} ` +
                        `by USMortality.com`,
                    font: {
                        size: 14,
                        weight: 600
                    }
                },
                legend: {
                    display: datasets.length > 1,
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
                            size: 12
                        },
                        color: 'rgba(120, 120, 120, 100%)',
                    },
                    ticks: {
                        font: {
                            weight: '200',
                            size: 11
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
                    max: getYMax(chartConfig),
                    title: {
                        display: true, text: chartConfig.dataSourceTitle,
                        font: {
                            weight: '200',
                            size: 12
                        },
                        color: 'rgba(120, 120, 120, 100%)',
                    },
                    ticks: {
                        font: {
                            weight: '200',
                            size: 11
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
