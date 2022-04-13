import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import { osuApiV2 } from '../libs/osu'
import { BaseDiscordCommand } from '../types'
import getEmoji from '../utils/getEmoji'
import getUser from '../utils/getUser'

export default class LinkCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('stacked')
    .setDescription('See your stacking score')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
    )
    .addStringOption((option) =>
      option.setName('mode')
        .setDescription('Game mode')
        .addChoice('Standard', 'osu')
        .addChoice('Catch The Beat', 'fruits')
        .addChoice('Taiko', 'taiko')
        .addChoice('Mania', 'mania')
    )

  calculateDeviation (best): number {
    const pps = best.map(score => score.pp)

    const total: number = pps.reduce((acc, current) => {
      return acc + current
    })

    const average = total / best.length
    const arr = pps.map(pp => (pp - average) ** 2)
    const sum = arr.reduce((acc, current) => acc + current, 0)
    const variance = sum / arr.length
    const deviation = Math.sqrt(variance)
    return Math.round((deviation / average) * 100)
  }

  async run (interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply()
    const username = interaction.options.getString('username')
    const mode = interaction.options.getString('mode') || 'osu'

    try {
      const { user, error: userError } = await getUser({
        username,
        discordId: interaction.user.id,
        mode
      })

      if (userError) {
        const embed = new MessageEmbed()
          .setDescription(`Couldn't find \`${username}\`.\nTry with a different username or re link your account with \`/link\`.`)
          .setColor(14504273)

        interaction.editReply({ embeds: [embed] })
        return
      }

      const best = await osuApiV2.getUserBestScores({
        id: user.id,
        mode
      })

      const pps = best.map(score => score.pp)
      const first = pps[0]
      const mid = pps[Math.floor(pps.length / 2)]
      const last = pps[pps.length - 1]

      const deviation = this.calculateDeviation(best)

      const embed = new MessageEmbed()
        .setAuthor({
          name: user.username,
          iconURL: user.avatar_url
        })
        .setURL(`https://osu.ppy.sh/users/${user.id}`)
        .addField('First', `${Math.round(first)}pp`, true)
        .addField('Mid', `${Math.round(mid)}pp`, true)
        .addField('Last', `${Math.round(last)}pp`, true)
        .addField(
          'Difference between first and last top',
          `${Math.round(first - last)}pp`, true
        )
        .setFooter({
          text: `${user.username} has a score of ${deviation}.`
        })
        .setColor(11279474)

      if (deviation >= 8) {
        embed.setTitle(`${getEmoji(mode)} You are not stacked.`)
      }

      if (deviation < 8 && deviation >= 5) {
        embed.setTitle(`${getEmoji(mode)} You are stacked.`)
      }

      if (deviation < 5) {
        embed.setTitle(`${getEmoji(mode)} You are sooooo stacked.`)
      }

      interaction.editReply({
        embeds: [embed]
      })
      return
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Couldn't find ${username}`)
        .setColor(14504273)

      interaction.editReply({ embeds: [embed] })
    }
  }
}
