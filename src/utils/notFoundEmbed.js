const { MessageEmbed } = require('discord.js')

const notFoundEmbed = new MessageEmbed()
  .setDescription('Either specify a username or link your discord to an osu! profile via `!link username`')
  .setColor(14504273)

module.exports = notFoundEmbed
