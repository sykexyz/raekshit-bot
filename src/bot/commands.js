
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const adminOnly = (b) => b.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

module.exports = [
  adminOnly(new SlashCommandBuilder().setName('token').setDescription('manage raider tokens')
    .addSubcommand(s => s.setName('add').setDescription('add a token')
      .addStringOption(o => o.setName('token').setDescription('user token').setRequired(true))
      .addStringOption(o => o.setName('proxy').setDescription('proxy url').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('remove token by id')
      .addIntegerOption(o => o.setName('id').setDescription('token id').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('list tokens'))
    .addSubcommand(s => s.setName('check').setDescription('validate all tokens'))),

  adminOnly(new SlashCommandBuilder().setName('raid').setDescription('start or manage a raid')
    .addSubcommand(s => s.setName('join').setDescription('mass join via invite')
      .addStringOption(o => o.setName('invite').setDescription('invite code or url').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('token count').setRequired(false))
      .addIntegerOption(o => o.setName('delay').setDescription('ms between actions').setRequired(false)))
    .addSubcommand(s => s.setName('leave').setDescription('mass leave guild')
      .addStringOption(o => o.setName('guild').setDescription('guild id').setRequired(true))
      .addIntegerOption(o => o.setName('delay').setDescription('ms between').setRequired(false)))
    .addSubcommand(s => s.setName('spam').setDescription('spam a channel')
      .addStringOption(o => o.setName('channel').setDescription('channel id').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('message text').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('token count').setRequired(false))
      .addIntegerOption(o => o.setName('delay').setDescription('ms between').setRequired(false)))
    .addSubcommand(s => s.setName('dm').setDescription('mass dm a user')
      .addStringOption(o => o.setName('user').setDescription('target user id').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('message text').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('token count').setRequired(false))
      .addIntegerOption(o => o.setName('delay').setDescription('ms between').setRequired(false)))
    .addSubcommand(s => s.setName('invite').setDescription('mass create invites')
      .addStringOption(o => o.setName('channel').setDescription('channel id').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('token count').setRequired(false))
      .addIntegerOption(o => o.setName('delay').setDescription('ms between').setRequired(false)))
    .addSubcommand(s => s.setName('react').setDescription('mass react to a message')
      .addStringOption(o => o.setName('channel').setDescription('channel id').setRequired(true))
      .addStringOption(o => o.setName('message_id').setDescription('message id').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('emoji').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('token count').setRequired(false)))
    .addSubcommand(s => s.setName('nick').setDescription('mass change nickname')
      .addStringOption(o => o.setName('guild').setDescription('guild id').setRequired(true))
      .addStringOption(o => o.setName('nickname').setDescription('new nickname').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('token count').setRequired(false)))
    .addSubcommand(s => s.setName('stop').setDescription('stop a running raid')
      .addIntegerOption(o => o.setName('id').setDescription('raid id').setRequired(true)))
    .addSubcommand(s => s.setName('stopall').setDescription('stop all raids'))
    .addSubcommand(s => s.setName('status').setDescription('list running raids'))),
];
