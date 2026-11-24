const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

fs.mkdirSync(path.dirname(cfg.dbPath), { recursive: true });

const db = new Database(cfg.dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  proxy TEXT,
  username TEXT,
  user_id TEXT,
  valid INTEGER DEFAULT 0,
  last_checked INTEGER,
  added_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS raids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  params TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  total INTEGER DEFAULT 0,
  success INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  started_at INTEGER DEFAULT (unixepoch()),
  ended_at INTEGER
);
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raid_id INTEGER,
  ts INTEGER DEFAULT (unixepoch()),
  level TEXT,
  message TEXT
);
CREATE INDEX IF NOT EXISTS idx_logs_raid ON logs(raid_id);
`);

module.exports = {
  db,
  addToken: (token, proxy) => {
    try {
      return db.prepare('INSERT INTO tokens (token, proxy) VALUES (?, ?)').run(token, proxy || null).lastInsertRowid;
    } catch { return null; }
  },
  removeToken: (id) => db.prepare('DELETE FROM tokens WHERE id = ?').run(id),
  listTokens: () => db.prepare('SELECT id, proxy, username, user_id, valid, last_checked, added_at, substr(token,1,20)||\'…\' AS token_preview FROM tokens ORDER BY id').all(),
  listTokensFull: () => db.prepare('SELECT * FROM tokens ORDER BY id').all(),
  validTokens: () => db.prepare('SELECT * FROM tokens WHERE valid = 1').all(),
  updateToken: (id, fields) => {
    const cols = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE tokens SET ${cols} WHERE id = ?`).run(...Object.values(fields), id);
  },
  createRaid: (type, params) => db.prepare('INSERT INTO raids (type, params) VALUES (?, ?)').run(type, JSON.stringify(params)).lastInsertRowid,
  updateRaid: (id, fields) => {
    const cols = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE raids SET ${cols} WHERE id = ?`).run(...Object.values(fields), id);
  },
  listRaids: (limit = 100) => db.prepare('SELECT * FROM raids ORDER BY id DESC LIMIT ?').all(limit),
  getRaid: (id) => db.prepare('SELECT * FROM raids WHERE id = ?').get(id),
  addLog: (raidId, level, message) => {
    db.prepare('INSERT INTO logs (raid_id, level, message) VALUES (?, ?, ?)').run(raidId, level, message);
  },
  getLogs: (raidId, limit = 500) => db.prepare('SELECT * FROM logs WHERE raid_id = ? ORDER BY id DESC LIMIT ?').all(raidId, limit),
  recentLogs: (limit = 200) => db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT ?').all(limit),
};
