const { REST, Routes } = require('discord.js');
const cfg = require('../config');
const commands = require('./commands');

(async () => {
  const rest = new REST({ version: '10' }).setToken(cfg.token);
  const body = commands.map(c => c.toJSON());

  try {
    if (cfg.devGuildId) {
      await rest.put(Routes.applicationGuildCommands(cfg.clientId, cfg.devGuildId), { body });
      console.log(`deployed ${body.length} commands to guild ${cfg.devGuildId}`);
    } else {
      await rest.put(Routes.applicationCommands(cfg.clientId), { body });
      console.log(`deployed ${body.length} global commands`);
    }
  } catch (e) {
    console.error('deploy failed:', e);
    process.exit(1);
  }
})();
