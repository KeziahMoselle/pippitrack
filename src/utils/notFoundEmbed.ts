import { MessageEmbed } from 'discord.js'

const notFoundEmbed = new MessageEmbed()
  .setTitle('Player not found.')
  .setDescription('Either specify a username or link your discord to an osu! profile via `/link username`')
  .setColor(14504273)

export default notFoundEmbed
