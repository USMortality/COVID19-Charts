#!/bin/sh
git pull
npm install
npm run build
npm run update
npm start
git add .
git commit -m "daily update $(date +"%Y/%m/%d")"
git push
