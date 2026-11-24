
const { Client, GatewayIntentBits, Events } = require('discord.js');
const cfg = require('../config');
const log = require('../utils/logger');
const { handle } = require('./handler');

function createCommander() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (c) => {
    log.info(`commander bot online as ${c.user.tag}`);
  });

  client.on(Events.InteractionCreate, handle);
  client.on(Events.Error, (e) => log.error(`commander client error: ${e.message}`));

  client.login(cfg.token).catch(e => {
    log.error(`commander login failed: ${e.message}`);
    process.exit(1);
  });

  return client;
}

module.exports = { createCommander };
