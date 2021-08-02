import { Message, MessageEmbed } from 'discord.js'
import { osuApiV2 } from '../libs/osu'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import getEmoji from '../utils/getEmoji'
import { BaseDiscordCommand } from '../types'

export default class RecentScoreCommand implements BaseDiscordCommand {
  name = 'rs'
  arguments = []
  description = 'Display your recent score'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message: Message, args: string[]): Promise<Message> {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
    }

    const [score] = await osuApiV2.getUserRecentScores({ id: user.id })

    if (score) {
      const embed = new MessageEmbed()
        .setTitle(`${user.name}'s recent score`)
        .setDescription(
          `${getEmoji(score.rank)} | ${score.beatmapset.artist} - ${
            score.beatmapset.title
          } [${score.beatmap.version}]`
        )
        .addField('mods', `+${score.mods.join('')}`, true)
        .setThumbnail(score.beatmapset.covers.list)

      return message.channel.send(embed)
    }

    const embed = new MessageEmbed().setDescription(
      `No recent score for ${user.name}`
    )

    return message.channel.send(embed)
  }
}
