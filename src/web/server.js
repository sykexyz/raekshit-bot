const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cfg = require('../config');
const log = require('../utils/logger');
const api = require('./api');

function createWebServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', api);
  app.use('/', express.static(path.join(__dirname, '..', '..', 'web')));

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.emit('hello', { ts: Date.now() });
  });

  log.setIo(io);

  server.listen(cfg.webPort, () => {
    log.info(`web dashboard → http://localhost:${cfg.webPort}`);
  });

  return { server, io };
}

module.exports = { createWebServer };
