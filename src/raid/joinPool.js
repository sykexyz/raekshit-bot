const { Client, GatewayIntentBits } = require('discord.js');

async function joinWithToken(token, inviteCode) {
  return new Promise((resolve) => {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
      ws: { properties: { os: 'Windows', browser: 'Chrome', device: '' } },
    });

    let resolved = false;
    const finish = (ok, msg) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      try { client.destroy(); } catch {}
      resolve({ ok, msg });
    };

    const timeout = setTimeout(() => finish(false, 'timeout (25s)'), 25000);

    client.once('clientReady', async () => {
      try {
        const invite = await client.fetchInvite(inviteCode).catch(() => null);
        if (!invite) return finish(false, 'invite invalid');
        if (invite.guild && client.guilds.cache.has(invite.guild.id)) {
          return finish(true, 'already in guild');
        }
        await client.acceptInvite(inviteCode).catch(err => finish(false, `accept failed: ${err.message}`));
      } catch (e) {
        finish(false, `join error: ${e.message}`);
      }
    });

    client.on('guildCreate', (guild) => finish(true, `joined ${guild.name} (${guild.id})`));
    client.on('error', (e) => finish(false, `client error: ${e.message}`));

    client.login(token).catch(e => finish(false, `login failed: ${e.message}`));
  });
}

module.exports = { joinWithToken };
