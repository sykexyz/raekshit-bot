const logger = require('../utils/logger');

class RaidEngine {
  constructor() {
    this.isRunning = false;
  }

  start() {
    logger.info('Raid engine initialized.');
    this.isRunning = true;
  }

  stop() {
    logger.info('Raid engine stopped.');
    this.isRunning = false;
  }
}

module.exports = new RaidEngine();
