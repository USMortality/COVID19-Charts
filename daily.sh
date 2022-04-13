#!/bin/sh
set -e

# Load nvm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 16

git pull
npm install
npm run build
npm run update

npm run start "world" "total_cases" "covid_cases" "COVID-19 Cases" "false" "false"
npm run start "world" "total_deaths" "covid_deaths" "COVID-19 Deaths" "false" "false"
npm run start "world" "total_cases_per_million" "covid_cases_million" "COVID-19 Cases (per Million)" "false" "false"
npm run start "world" "total_deaths_per_million" "covid_deaths_million" "COVID-19 Deaths (per Million)" "false" "false"

npm run start "world" "icu_patients" "icu_patients" "COVID-19 ICU" "true" "false"
npm run start "world" "hosp_patients" "hosp_patients" "COVID-19 Hospitalized" "true" "false"
npm run start "world" "icu_patients_per_million" "icu_patients_million" "COVID-19 ICU (per Million)" "true" "false"
npm run start "world" "hosp_patients_per_million" "hosp_patients_million" "COVID-19 Hospitalized (per Million)" "true" "false"

npm run start "world" "people_vaccinated" "vaccinated_1" "COVID-19 Vaccinated (1st)" "false" "false"
npm run start "world" "people_fully_vaccinated" "vaccinated_2" "COVID-19 Vaccinated (2nd)" "false" "false"
npm run start "world" "total_boosters" "vaccinated_3" "COVID-19 Vaccinated (Booster)" "false" "false"
npm run start "world" "people_vaccinated_per_hundred" "vaccinated_1_per_hundred" "COVID-19 Vaccinated (1st, per 100)" "true" "true"
npm run start "world" "people_fully_vaccinated_per_hundred" "vaccinated_2_per_hundred" "COVID-19 Vaccinated (2nd, per 100)" "true" "true"
npm run start "world" "total_boosters_per_hundred" "vaccinated_3_per_hundred" "COVID-19 Vaccinated (Booster, per 100)" "true" "true"
npm run start "world" "total_vaccinations_per_hundred" "total_vaccinations_hundred" "COVID-19 Vaccinated (Any dose, per 100)" "false" "false"
npm run start "world" "stringency_index" "stringency_index" "Oxford COVID-19 Stringency Index (%)" "true" "true"

npm run start "world" "total_tests_per_thousand" "total_tests_thousand" "COVID-19 Tests (per Thousand)" "false" "false"
npm run start "world" "excess_mortality_cumulative_per_million" "excess_mortality_cumulative_million" "Cumulative All-Cause Excess Mortality (per Million)" "true" "false"

npm run start "us" "cases" "covid_cases" "COVID-19 Cases" "false" "false"
npm run start "us" "deaths" "covid_deaths" "COVID-19 Deaths" "false" "false"

npm run stitch

git add .
git commit -m "update"
git reset $(git commit-tree HEAD^{tree} -m "daily update $(date +"%Y/%m/%d")")
git push
