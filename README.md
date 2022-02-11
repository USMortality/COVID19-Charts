# Install

MacOS
```
brew install pkg-config cairo pango libpng jpeg giflib librsvg nvm redis ffmpeg
```

Ubuntu
```
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev redis ffmpeg
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
npm run start
npm run start us
npm run start us '["california", "texas"]'
npm run start world '["germany"]'
```

```
node dist/src/worker.js world ./data/world.csv united_states 6 1
```
