const logger = require('../utils/logger');

async function deployCommands() {
  logger.info('Deploying slash commands...');
}

if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands };
