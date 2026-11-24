
const { discordRest, sleep } = require('../utils/rest');
const { joinWithToken } = require('./joinPool');
const { getPool } = require('../accounts');
const db = require('../db');
const log = require('../utils/logger');

const runningTasks = new Map();

function makeCtx(raidId, total) {
  const ctx = {
    raidId, total, success: 0, failed: 0, stop: false,
    cb: (ok, msg) => {
      if (ok) ctx.success++; else ctx.failed++;
      (ok ? log.success : log.warn).call(log, msg, raidId);
      db.updateRaid(raidId, { success: ctx.success, failed: ctx.failed });
    },
  };
  return ctx;
}

function finalize(ctx) {
  if (!runningTasks.has(ctx.raidId)) return;
  runningTasks.delete(ctx.raidId);
  db.updateRaid(ctx.raidId, {
    status: ctx.stop ? 'stopped' : 'done',
    ended_at: Math.floor(Date.now() / 1000),
    success: ctx.success,
    failed: ctx.failed,
  });
  log.info(`raid #${ctx.raidId} finished — ${ctx.success} ok / ${ctx.failed} failed`, ctx.raidId);
}

async function startRaid(type, params) {
  const pool = await getPool();
  if (pool.length === 0) return { error: 'no valid tokens in pool' };

  const raidId = db.createRaid(type, params);
  const delay = params.delay ?? 1000;
  const count = Math.min(params.count ?? pool.length, pool.length);
  const targets = pool.slice(0, count);
  const ctx = makeCtx(raidId, count);
  runningTasks.set(raidId, ctx);
  db.updateRaid(raidId, { total: count });

  log.info(`raid #${raidId} started: ${type} × ${count} tokens`, raidId);

  (async () => {
    for (const tk of targets) {
      if (ctx.stop) break;
      try {
        const r = await dispatch(type, tk, params);
        ctx.cb(r.ok, `${tk.userId || `tok#${tk.id}`}: ${r.msg}`);
      } catch (e) {
        ctx.cb(false, `${tk.userId || `tok#${tk.id}`}: exception ${e.message}`);
      }
      await sleep(delay);
    }
    finalize(ctx);
  })();

  return { raidId };
}

async function dispatch(type, tk, p) {
  switch (type) {
    case 'join': {
      const r = await joinWithToken(tk.token, p.invite);
      return { ok: r.ok, msg: r.msg };
    }
    case 'leave': {
      const r = await discordRest(tk.token, 'DELETE', `/users/@me/guilds/${p.guildId}`, null, tk.proxy);
      return { ok: r.ok, msg: r.ok ? `left ${p.guildId}` : `leave ${r.status}` };
    }
    case 'spam': {
      const r = await discordRest(tk.token, 'POST', `/channels/${p.channelId}/messages`, { content: p.message }, tk.proxy);
      return { ok: r.ok, msg: r.ok ? `sent in ${p.channelId}` : `spam ${r.status}` };
    }
    case 'dm': {
      const dm = await discordRest(tk.token, 'POST', '/users/@me/channels', { recipient_id: p.targetId }, tk.proxy);
      if (!dm.ok) return { ok: false, msg: `dm open ${dm.status}` };
      const r = await discordRest(tk.token, 'POST', `/channels/${dm.data.id}/messages`, { content: p.message }, tk.proxy);
      return { ok: r.ok, msg: r.ok ? `dm → ${p.targetId}` : `dm ${r.status}` };
    }
    case 'invite': {
      const r = await discordRest(tk.token, 'POST', `/channels/${p.channelId}/invites`, { max_age: 0, max_uses: 0 }, tk.proxy);
      return { ok: r.ok, msg: r.ok ? `invite ${r.data.code}` : `invite ${r.status}` };
    }
    case 'react': {
      const emoji = encodeURIComponent(p.emoji);
      const r = await discordRest(tk.token, 'PUT', `/channels/${p.channelId}/messages/${p.messageId}/reactions/${emoji}/@me`, null, tk.proxy);
      return { ok: r.ok, msg: r.ok ? 'reacted' : `react ${r.status}` };
    }
    case 'nick': {
      const r = await discordRest(tk.token, 'PATCH', `/guilds/${p.guildId}/members/@me`, { nick: p.nickname }, tk.proxy);
      return { ok: r.ok, msg: r.ok ? 'nick set' : `nick ${r.status}` };
    }
    default:
      return { ok: false, msg: `unknown type ${type}` };
  }
}

function stopRaid(raidId) {
  const ctx = runningTasks.get(raidId);
  if (!ctx) return false;
  ctx.stop = true;
  return true;
}

function stopAll() {
  const n = runningTasks.size;
  for (const ctx of runningTasks.values()) ctx.stop = true;
  return n;
}

function status() {
  return Array.from(runningTasks.entries()).map(([id, c]) => ({
    raidId: id, total: c.total, success: c.success, failed: c.failed,
  }));
}

module.exports = { startRaid, stopRaid, stopAll, status };
