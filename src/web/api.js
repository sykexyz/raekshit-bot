const express = require('express');
const cfg = require('../config');
const db = require('../db');
const log = require('../utils/logger');
const { checkAll } = require('../accounts');
const engine = require('../raid/engine');

const router = express.Router();

router.use((req, res, next) => {
  const key = req.header('x-api-key') || req.query.key;
  if (key !== cfg.webApiKey) return res.status(401).json({ error: 'unauthorized' });
  next();
});

router.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

router.get('/tokens', (req, res) => res.json(db.listTokens()));

router.post('/tokens', (req, res) => {
  const { token, proxy } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });
  const id = db.addToken(token, proxy);
  if (!id) return res.status(409).json({ error: 'duplicate or invalid' });
  log.info(`web: token #${id} added`);
  res.json({ id });
});

router.delete('/tokens/:id', (req, res) => {
  const r = db.removeToken(parseInt(req.params.id, 10));
  res.json({ removed: r.changes });
});

router.post('/tokens/check', async (req, res) => {
  const r = await checkAll();
  res.json(r);
});

router.get('/raids', (req, res) => res.json(db.listRaids()));
router.get('/raids/active', (req, res) => res.json(engine.status()));
router.get('/raids/:id', (req, res) => {
  const raid = db.getRaid(parseInt(req.params.id, 10));
  if (!raid) return res.status(404).json({ error: 'not found' });
  res.json(raid);
});
router.get('/raids/:id/logs', (req, res) => {
  res.json(db.getLogs(parseInt(req.params.id, 10)).reverse());
});

router.post('/raids', async (req, res) => {
  const { type, params } = req.body || {};
  if (!type || !params) return res.status(400).json({ error: 'type + params required' });
  const result = await engine.startRaid(type, params);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

router.post('/raids/:id/stop', (req, res) => {
  const ok = engine.stopRaid(parseInt(req.params.id, 10));
  res.json({ stopped: ok });
});

router.post('/raids/stopall', (req, res) => {
  res.json({ stopped: engine.stopAll() });
});

router.get('/logs', (req, res) => res.json(db.recentLogs().reverse()));

module.exports = router;
