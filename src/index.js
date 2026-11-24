require('dotenv').config();
const config = require('./config');
const logger = require('./utils/logger');
const { initBot } = require('./bot/client');
const { startServer } = require('./web/server');

async function main() {
  logger.info('Starting raekshxt-bot...');
  try {
    startServer();
    await initBot();
    logger.info('raekshxt-bot is fully operational.');
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();
