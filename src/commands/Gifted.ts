import { CommandInteraction, MessageEmbed } from 'discord.js'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { BaseDiscordCommand } from '../types'
import getOsuAvatar from '../utils/getOsuAvatar'
import { SlashCommandBuilder } from '@discordjs/builders'

export default class RecentScoreCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('gifted')
    .setDescription('Is a player gifted or enjoying the game?')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('osu! username')
    )

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')

    const user = await getUser({
      discordId: interaction.user.id,
      username
    })

    if (!user) {
      return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true })
    }

    const score = Number(
      ((Number(user.pp.raw) / user.counts.plays) * 10).toFixed(2)
    )

    const embed = new MessageEmbed()
      .setAuthor({
        name: user.name,
        iconURL: getOsuAvatar(user.id)
      })
      .setURL(`https://osu.ppy.sh/users/${user.id}`)

    if (score <= 0.5) {
      embed.setTitle('It seems you are enjoying the game.')
        .setColor(11279474)
    }

    if (score > 0.5 && score < 1.3) {
      embed.setTitle('It seems you are pretty average.')
        .setColor(11279474)
    }

    if (score >= 1.3 && score < 2) {
      embed.setTitle('You are gifted!')
        .setColor('#8850ff')
    }

    if (score >= 2) {
      embed.setTitle('You are OMEGA gifted!')
        .setColor('#50b2ff')
    }

    embed.setFooter({
      text: `${user.name} has a score of ${score}.`
    })

    return interaction.reply({ embeds: [embed] })
  }
}
