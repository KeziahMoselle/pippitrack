import { MessageEmbed, CommandInteraction } from 'discord.js'
import axios from 'axios'
import getUser from '../utils/getUser'
import getRankAchievements from '../utils/getRankAchievements'
import { BaseDiscordCommand } from '../types'
import { SlashCommandBuilder } from '@discordjs/builders'
import getModeInt from '../utils/getModeInt'
import getEmoji from '../utils/getEmoji'

const intl = new Intl.DateTimeFormat('en-US')

export default class PeakCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('peak')
    .setDescription('Display peak rank, accuracy, playcount, replay watched and recent rank.')
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

    try {
      const response = await axios.get(`https://osutrack-api.ameo.dev/peak?user=${user.id}&mode=${getModeInt(mode)}`)
      const { medalsUrl } = getRankAchievements(user.user_achievements)

      const peak = response.data[0]
      const rank = peak.best_global_rank
      const bestAccuracy = peak.best_accuracy.toFixed(2)
      const bestPlaycount = user.monthly_playcounts.reduce(function (prev, current) {
        return (prev.count > current.count) ? prev : current
      })
      const bestRankRecentMonths = Math.min(...user.rank_history.data)
      const bestReplayWatched = user.replays_watched_counts.reduce(function (prev, current) {
        return (prev.count > current.count) ? prev : current
      })

      const embed = new MessageEmbed()
        .setTitle(`${getEmoji(mode)} Peak stats for : ${user.username}`)
        .setThumbnail(user.avatar_url)
        .addField('Max rank', `#${rank}`, true)
        .addField('Best accuracy', `${bestAccuracy}%`, true)
        .addField('Best rank in recent months', `#${bestRankRecentMonths}`)
        .addField('Most playcount in a month', `${intl.format(new Date(bestPlaycount.start_date))} with ${bestPlaycount.count} playcount.`)
        .addField('Best replay watched', `${intl.format(new Date(bestReplayWatched.start_date))} with ${bestReplayWatched.count} replay${bestReplayWatched.count > 0 ? 's' : ''} watched.`)
        .setFooter({
          text: 'Some of these data may be incorrect if the profile has not been updated regularly with /update or by visiting https://ameobea.me/osutrack/ regularly.'
        })
        .setURL(
          `https://ameobea.me/osutrack/user/${encodeURIComponent(user.username)}`
        )
        .setColor(11279474)

      return interaction.reply({
        embeds: [embed],
        files: [medalsUrl]
      })
    } catch (error) {
      interaction.reply({ content: error.message, ephemeral: true })
    }
  }
}
