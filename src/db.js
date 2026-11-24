const logger = require('./utils/logger');

const db = {
  connect: async () => {
    logger.info('Connecting to database...');
  },
  disconnect: async () => {
    logger.info('Disconnecting from database...');
  }
};

module.exports = db;
