const log = require('./utils/logger');
const { createWebServer } = require('./web/server');
const { createCommander } = require('./bot/client');

process.on('unhandledRejection', (e) => log.error(`unhandled: ${e?.message || e}`));
process.on('uncaughtException', (e) => log.error(`uncaught: ${e?.message || e}`));

log.info('raekshxt-bot booting…');

const { server } = createWebServer();
const bot = createCommander();

const shutdown = () => {
  log.warn('shutting down…');
  try { bot?.destroy(); } catch {}
  try { server?.close(); } catch {}
  setTimeout(() => process.exit(0), 300);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
