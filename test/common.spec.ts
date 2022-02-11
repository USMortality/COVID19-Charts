import { readFile } from 'fs'
import { deepEqual } from 'assert'
import { expect } from 'chai'
import {
    addDays, fillerArray, fillerDateArray, getKey, getNameFromKey,
    getNumberLength, processCsvRows, capitalizeFirstLetters, dateString
} from '../src/common.js'
import { Row } from '../src/series.js'
import 'jest'

describe('common.ts', () => {
    describe('fillerArray', () => {
        it('fillerArray returns array of 2x undefinded', () => {
            const result = fillerArray(2)
            expect(result.length).to.equal(2)
            expect(result[0]).to.equal(undefined)
            expect(result[1]).to.equal(undefined)
        })
        it('fillerArray return array of 2x string', () => {
            const result = fillerArray(2, 'string')
            expect(result.length).to.equal(2)
            expect(result[0]).to.equal('string')
            expect(result[1]).to.equal('string')
        })
    })
    describe('fillerDateArray', () => {
        it('produces array with 2 dates by increasing day', () => {
            const date = new Date()
            const result = fillerDateArray(date, 2)
            expect(result.length).to.equal(2)
            deepEqual(result[0], date)
            deepEqual(result[1], addDays(date, 1))
        })
    })
    describe('getKey', () => {
        it('transforms a country string into a key', () => {
            const result = getKey('Cote d\'Ivoir')
            expect(result).to.equal('cote_d_ivoir')
        })
    })
    describe('getNameFromKey', () => {
        it('capitalizes name from key again', () => {
            const result = getNameFromKey('cote_d_ivoir')
            expect(result).to.equal('Cote D Ivoir')
        })
    })
    describe('addDays', () => {
        it('adds a day to given date', () => {
            const date = new Date()
            deepEqual(date, addDays(date, 0))
            const newDate = addDays(date, 1)
            expect(Math.abs(+date - +newDate)).to.equal(24 * 60 * 60 * 1000)
        })
    })
    describe('getNumberLength', () => {
        it('returns the digits of a number', () => {
            expect(getNumberLength(0)).to.equal(1)
            expect(getNumberLength(123)).to.equal(3)
        })
    })
    describe('processCsvRows', () => {
        it('usa.csv format parsing', async () => {
            const data = await processCsvRows([
                { 'date': '2020-03-17', 'state': 'Florida', 'cases': '10' },
                { 'date': '2020-03-18', 'state': 'Florida', 'cases': '15' },
                { 'date': '2020-03-17', 'state': 'Texas', 'cases': '25' }
            ])
            const flData: Row[] = data.get('florida')
            expect(flData.length).to.equal(2)
            deepEqual(flData[0].date, new Date('2020-03-17'))
            deepEqual(flData[1].date, new Date('2020-03-18'))
            expect(flData[0].cases).to.equal(10)
        })
        it('world.csv format parsing', async () => {
            const data = await processCsvRows([
                {
                    'date': '2020-03-17',
                    'location': 'Germany',
                    'total_cases': '10'
                },
                {
                    'date': '2020-03-18',
                    'location': 'Germany',
                    'total_cases': '15'
                },
                {
                    'date': '2020-03-17',
                    'location': 'France',
                    'total_cases': '25'
                }
            ])
            const flData: Row[] = data.get('germany')
            expect(flData.length).to.equal(2)
            deepEqual(flData[0].date, new Date('2020-03-17'))
            deepEqual(flData[1].date, new Date('2020-03-18'))
            expect(flData[0].cases).to.equal(10)
        })
    })
    describe('capitalizeFirstLetters', () => {
        expect(capitalizeFirstLetters('lorem ipsum a dolores'))
            .to.equal('Lorem Ipsum A Dolores')
    })
    describe('dateString', () => {
        expect(dateString(new Date('2020-01-01'))).to.equal('1/1/2020')
    })
})
