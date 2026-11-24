const { EmbedBuilder } = require('discord.js');
const cfg = require('../config');
const db = require('../db');
const log = require('../utils/logger');
const { validateToken, checkAll } = require('../accounts');
const engine = require('../raid/engine');

const isOwner = (userId) => cfg.owners.includes(userId);

async function handle(interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (!isOwner(interaction.user.id)) {
    return interaction.reply({ content: 'not authorized', ephemeral: true });
  }

  const group = interaction.commandName;
  const sub = interaction.options.getSubcommand();

  try {
    if (group === 'token') return await handleToken(interaction, sub);
    if (group === 'raid')  return await handleRaid(interaction, sub);
  } catch (e) {
    log.error(`command ${group} ${sub} failed: ${e.message}`);
    const payload = { content: `error: ${e.message}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

async function handleToken(interaction, sub) {
  if (sub === 'add') {
    const token = interaction.options.getString('token');
    const proxy = interaction.options.getString('proxy') || null;
    const id = db.addToken(token, proxy);
    if (!id) return interaction.reply({ content: 'duplicate or invalid token', ephemeral: true });
    await interaction.reply({ content: `token #${id} added — validating…`, ephemeral: true });
    const row = db.listTokensFull().find(r => r.id === id);
    await validateToken(row);
    return;
  }

  if (sub === 'remove') {
    const id = interaction.options.getInteger('id');
    const r = db.removeToken(id);
    return interaction.reply({ content: r.changes ? `removed #${id}` : `#${id} not found`, ephemeral: true });
  }

  if (sub === 'list') {
    const rows = db.listTokens();
    if (rows.length === 0) return interaction.reply({ content: 'no tokens', ephemeral: true });
    const embed = new EmbedBuilder().setTitle(`tokens (${rows.length})`).setColor(0x00e0ff);
    const lines = rows.slice(0, 25).map(r =>
      `#${r.id} · ${r.valid ? '✅' : '❌'} · ${r.username || 'unknown'} · \`${r.token_preview}\``
    );
    embed.setDescription(lines.join('\n'));
    if (rows.length > 25) embed.setFooter({ text: `showing 25/${rows.length}` });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === 'check') {
    await interaction.deferReply({ ephemeral: true });
    const r = await checkAll();
    return interaction.editReply({ content: `checked ${r.total} — valid: ${r.valid}` });
  }
}

async function handleRaid(interaction, sub) {
  if (sub === 'status') {
    const active = engine.status();
    if (active.length === 0) return interaction.reply({ content: 'no active raids', ephemeral: true });
    const lines = active.map(r => `#${r.raidId} · ${r.success}/${r.total} ok · ${r.failed} failed`);
    return interaction.reply({ content: lines.join('\n'), ephemeral: true });
  }

  if (sub === 'stop') {
    const id = interaction.options.getInteger('id');
    const ok = engine.stopRaid(id);
    return interaction.reply({ content: ok ? `stopping raid #${id}` : `raid #${id} not active`, ephemeral: true });
  }

  if (sub === 'stopall') {
    const n = engine.stopAll();
    return interaction.reply({ content: `stopping ${n} raid(s)`, ephemeral: true });
  }

  const params = {};
  const get = (k) => interaction.options.getInteger(k) ?? undefined;
  const str = (k) => interaction.options.getString(k) ?? undefined;

  if (sub === 'join')   { params.invite = str('invite').split('/').pop(); params.count = get('count'); params.delay = get('delay'); }
  if (sub === 'leave')  { params.guildId = str('guild'); params.delay = get('delay'); }
  if (sub === 'spam')   { params.channelId = str('channel'); params.message = str('message'); params.count = get('count'); params.delay = get('delay'); }
  if (sub === 'dm')     { params.targetId = str('user'); params.message = str('message'); params.count = get('count'); params.delay = get('delay'); }
  if (sub === 'invite') { params.channelId = str('channel'); params.count = get('count'); params.delay = get('delay'); }
  if (sub === 'react')  { params.channelId = str('channel'); params.messageId = str('message_id'); params.emoji = str('emoji'); params.count = get('count'); }
  if (sub === 'nick')   { params.guildId = str('guild'); params.nickname = str('nickname'); params.count = get('count'); }

  const res = await engine.startRaid(sub, params);
  if (res.error) return interaction.reply({ content: `failed: ${res.error}`, ephemeral: true });
  return interaction.reply({ content: `raid #${res.raidId} started — \`/raid status\` to monitor`, ephemeral: true });
}

module.exports = { handle };
