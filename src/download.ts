import { download } from './common.js'

async function main(): Promise<void> {
    console.log('Updating data/data.csv...')
    await download('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv', './data/us.csv')

    console.log('Updating data/world.csv...')
    await download('https://github.com/owid/covid-19-data/blob/master/public/data/owid-covid-data.csv?raw=true', './data/world.csv')

    console.log('Data update complete!')
}

main()