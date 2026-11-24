# raekshxt-bot

## Project Structure

```
raekshxt-bot/
├── package.json
├── .env.example
├── Dockerfile
├── .dockerignore
├── .gitignore
├── README.md
├── data/
│   └── .gitkeep
├── src/
│   ├── index.js
│   ├── config.js
│   ├── db.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── rest.js
│   ├── accounts.js
│   ├── raid/
│   │   ├── engine.js
│   │   └── joinPool.js
│   ├── bot/
│   │   ├── client.js
│   │   ├── deploy.js
│   │   ├── commands.js
│   │   └── handler.js
│   └── web/
│       ├── server.js
│       └── api.js
└── web/
    ├── index.html
    ├── app.js
    └── style.css
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Start the application:
   ```bash
   npm start
   ```
