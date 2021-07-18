import { MessageEmbed } from 'discord.js'
import { osuApiV2 } from '../libs/osu'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import getEmoji from '../utils/getEmoji'

export default class RecentScoreCommand {
  name = 'rs'
  arguments = []
  description = 'Display your recent score'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
    }

    const [score] = await osuApiV2.getUserRecentScores({ id: user.id })

    const embed = new MessageEmbed()
      .setTitle(`${user.name}'s recent score`)
      .setDescription(`${getEmoji(score.rank)} | ${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`)
      .addField('mods', `+${score.mods.join('')}`, true)
      .setThumbnail(osuApiV2.getBeatmapsetCoverImage(score.beatmap.beatmapset_id))

    return message.channel.send(embed)
  }
}
