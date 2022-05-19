import { CommandInteraction, MessageEmbed } from 'discord.js'
import getUser from '../utils/getUser'
import { BaseDiscordCommand } from '../types'
import { SlashCommandBuilder } from '@discordjs/builders'
import getEmoji from '../utils/getEmoji'

export default class RecentScoreCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('gifted')
    .setDescription('Is a player gifted or enjoying the game?')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('osu! username')
    )
    .addStringOption((option) =>
      option.setName('mode')
        .setDescription('Game mode')
        .addChoice('Standard', 'osu')
        .addChoice('Catch The Beat', 'fruits')
        .addChoice('Taiko', 'taiko')
        .addChoice('Mania', 'mania')
    )

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')
    const selectedMode = interaction.options.getString('mode')

    const { user, mode, error } = await getUser({
      discordId: interaction.user.id,
      username,
      mode: selectedMode
    })

    if (error) {
      const embed = new MessageEmbed()
        .setDescription(`Couldn't find \`${username}\`.\nTry with a different username or re link your account with \`/link\`.`)
        .setColor(14504273)

      interaction.editReply({ embeds: [embed] })
      return
    }

    const score = Number(
      ((Number(user.statistics.pp) / user.statistics.play_count) * 10).toFixed(2)
    )

    const embed = new MessageEmbed()
      .setAuthor({
        name: user.username,
        iconURL: user.avatar_url
      })
      .setURL(`https://osu.ppy.sh/users/${user.id}`)

    if (score <= 0.5) {
      embed.setTitle(`${getEmoji(mode)} It seems you are enjoying the game.`)
        .setColor(11279474)
    }

    if (score > 0.5 && score < 1.3) {
      embed.setTitle(`${getEmoji(mode)} It seems you are pretty average.`)
        .setColor(11279474)
    }

    if (score >= 1.3 && score < 2) {
      embed.setTitle(`${getEmoji(mode)} You are gifted!`)
        .setColor('#8850ff')
    }

    if (score >= 2) {
      embed.setTitle(`${getEmoji(mode)} You are OMEGA gifted!`)
        .setColor('#50b2ff')
    }

    embed.setFooter({
      text: `${user.username} has a score of ${score}.`
    })

    return interaction.reply({ embeds: [embed] })
  }
}
