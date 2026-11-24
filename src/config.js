require('dotenv').config();

const required = (name) => {
  const v = process.env[name];
  if (!v) { console.error(`[config] missing required env: ${name}`); process.exit(1); }
  return v;
};

module.exports = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  devGuildId: process.env.DEV_GUILD_ID || null,
  owners: (process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  webPort: parseInt(process.env.WEB_PORT || '8080', 10),
  webApiKey: process.env.WEB_API_KEY || 'changeme',
  dbPath: process.env.DB_PATH || './data/raider.db',
  defaultProxy: process.env.DEFAULT_PROXY || null,
};
