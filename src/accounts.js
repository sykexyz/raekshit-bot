const { discordRest } = require('./utils/rest');
const db = require('./db');
const log = require('./utils/logger');

async function validateToken(row) {
  const res = await discordRest(row.token, 'GET', '/users/@me', null, row.proxy);
  if (res.ok && res.data && res.data.id) {
    db.updateToken(row.id, {
      valid: 1,
      username: `${res.data.username}${res.data.discriminator && res.data.discriminator !== '0' ? '#' + res.data.discriminator : ''}`,
      user_id: res.data.id,
      last_checked: Math.floor(Date.now() / 1000),
    });
    log.success(`token #${row.id} valid → ${res.data.username} (${res.data.id})`);
    return true;
  }
  db.updateToken(row.id, { valid: 0, last_checked: Math.floor(Date.now() / 1000) });
  log.warn(`token #${row.id} invalid (${res.status || res.error})`);
  return false;
}

async function checkAll() {
  const rows = db.listTokensFull();
  const results = [];
  for (const r of rows) results.push(await validateToken(r));
  return { total: rows.length, valid: results.filter(Boolean).length };
}

async function getPool() {
  return db.validTokens().map(r => ({ token: r.token, proxy: r.proxy, id: r.id, userId: r.user_id }));
}

module.exports = { validateToken, checkAll, getPool };
