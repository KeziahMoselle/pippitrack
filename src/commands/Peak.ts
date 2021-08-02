import { MessageEmbed, Message } from 'discord.js'
import axios from 'axios'
import { osuApiV2 } from '../libs/osu'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import getRankAchievements from '../utils/getRankAchievements'
import { BaseDiscordCommand } from '../types'

export default class PeakCommand implements BaseDiscordCommand {
  name = 'peak'
  arguments = ['username']
  description = 'Display peak rank and accuracy of a player'
  category = 'osu'

  PEAK_ENDPOINT = (id: string | number): string =>
    `https://osutrack-api.ameo.dev/peak?user=${id}&mode=0`

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message: Message, args: string[]): Promise<Message> {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
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
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Max rank', `#${rank}`, true)
        .addField('Best accuracy', `${bestAccuracy}%`, true)
        .setFooter(
          'These data may be incorrect if the profile has not yet been tracked on https://ameobea.me/osutrack/'
        )
        .setURL(
          `https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`
        )
        .setColor(11279474)

      if (medalsUrl) {
        embed.attachFiles([medalsUrl])
      }

      return message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${args.join(' ')}`)
        .setDescription(
          `
          https://osu.ppy.sh/users/${args.join(' ')}
          https://ameobea.me/osutrack/user/${args.join(' ')}`
        )
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}
