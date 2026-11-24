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
# raekshxt-bot

External Discord raider driven by slash commands + a web dashboard.

## features
- token pool with validation, per-token proxy support
- mass join (gateway session), mass leave, spam, mass DM, invite generation, reactions, nick changes
- commander bot exposes `/token` and `/raid` slash commands, admin-gated
- web dashboard at `http://localhost:8080` — live logs, raid control, token management
- SQLite persistence for tokens, raids, and logs

## setup
1. `npm install`
2. `cp .env.example .env` and fill in values
3. `npm run deploy` (registers slash commands — run once, and again after command changes)
4. `npm start`
5. dashboard → `http://localhost:8080` (prompt for API key on first load)

## commands
- `/token add` `/token remove` `/token list` `/token check`
- `/raid join` `/raid leave` `/raid spam` `/raid dm` `/raid invite` `/raid react` `/raid nick`
- `/raid status` `/raid stop` `/raid stopall`

## notes
- joins go through a gateway client (temp per action) — proxy is REST-only
- spam/dm are rate limited — keep `delay` sane (1000ms+ default)
- joins are heavily throttled by Discord (~10min per token per guild) — plan accordingly

## deploy
```bash
docker build -t raekshxt-bot .
docker run -d -p 8080:8080 --env-file .env -v $(pwd)/data:/app/data raekshxt-bot
