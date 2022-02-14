# Install

MacOS
```
brew install pkg-config cairo pango libpng jpeg giflib librsvg nvm redis ffmpeg
```

Ubuntu
```
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev redis ffmpeg imagemagick
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
```

Both
```
nvm install 16
nvm alias default 16
npm i
```

# Run
```
npm run build
npm run update
redis-server

npm start
```

# Test
```
npm run test
npm run test:coverage
```

# Development
```
npm run watch
```

Run batch
```
npm run start world total_cases "cases" "COVID-19 Cases"
npm run start world total_cases "cases" "COVID-19 Cases" '["germany"]'
```

# Crontab Automated Daily Runs
`46 18 * * * sh /root/COVID19-Charts/daily.sh >> /root/log/COVID19-Charts.log 2>&1`
