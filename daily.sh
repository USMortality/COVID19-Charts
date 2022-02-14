#!/bin/sh
cd /root/COVID19-Charts/

# Load nvm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 16

git pull
rm -f package-lock.json
npm install
npm run build
npm run update

npm run start world total_cases "covid_cases" "COVID-19 Cases"
npm run start world total_deaths "covid_deaths" "COVID-19 Deaths"
npm run start us cases "covid_cases" "COVID-19 Cases"
npm run start us deaths "covid_deaths" "COVID-19 Deaths"

git add .
git commit -m "daily update $(date +"%Y/%m/%d")"
git push
