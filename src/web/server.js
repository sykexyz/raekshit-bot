const express = require('express');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const apiRoutes = require('./api');

function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../web')));
  app.use('/api', apiRoutes);

  app.listen(config.port, () => {
    logger.info(`Web server running on http://localhost:${config.port}`);
  });

  return app;
}

module.exports = { startServer };
