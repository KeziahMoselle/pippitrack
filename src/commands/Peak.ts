import { MessageEmbed, CommandInteraction } from 'discord.js'
import axios from 'axios'
import { osuApiV2 } from '../libs/osu'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import getRankAchievements from '../utils/getRankAchievements'
import { BaseDiscordCommand } from '../types'
import getOsuAvatar from '../utils/getOsuAvatar'
import { SlashCommandBuilder } from '@discordjs/builders'

export default class PeakCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('peak')
    .setDescription('Display peak rank and accuracy of a player')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
    )

  PEAK_ENDPOINT = (id: string | number): string =>
    `https://osutrack-api.ameo.dev/peak?user=${id}&mode=0`

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')

    const user = await getUser({
      username,
      discordId: interaction.user.id
    })

    if (!user) {
      return interaction.reply({ embeds: [notFoundEmbed] })
    }

    try {
      const [response, medals] = await Promise.all([
        axios.get(this.PEAK_ENDPOINT(user.id)),
        osuApiV2.getUserAchievements({ id: user.id })
      ])

      const { medalsUrl } = getRankAchievements(medals)

      const peak = response.data[0]
      const rank = peak.best_global_rank
      const bestAccuracy = peak.best_accuracy.toFixed(2)

      const embed = new MessageEmbed()
        .setTitle(`Peak stats for : ${user.name}`)
        .setThumbnail(getOsuAvatar(user.id))
        .addField('Max rank', `#${rank}`, true)
        .addField('Best accuracy', `${bestAccuracy}%`, true)
        .setFooter(
          'These data may be incorrect if the profile has not yet been tracked on https://ameobea.me/osutrack/'
        )
        .setURL(
          `https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`
        )
        .setColor(11279474)

      return interaction.reply({
        embeds: [embed],
        files: [medalsUrl]
      })
    } catch {
      interaction.reply({ embeds: [notFoundEmbed], ephemeral: true })
    }
  }
}
