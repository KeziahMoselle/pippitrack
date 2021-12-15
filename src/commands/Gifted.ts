import { Message, MessageEmbed } from 'discord.js'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { BaseDiscordCommand } from '../types'

export default class RecentScoreCommand implements BaseDiscordCommand {
  name = 'gifted'
  arguments = []
  description = 'Is a player gifted or not?'
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

    const score = Number(
      ((Number(user.pp.raw) / user.counts.plays) * 10).toFixed(2)
    )

    const embed = new MessageEmbed()
      .setAuthor(user.name, `http://s.ppy.sh/a/${user.id}`)

    if (score >= 0 && score < 1) {
      embed.setTitle('It seems you are pretty average.')
        .setFooter(`${user.name} has a score of ${score}.`)
        .setColor(11279474)
    }

    if (score >= 1 && score < 2) {
      embed.setTitle('You are gifted!')
        .setFooter(`${user.name} has a score of ${score}.`)
        .setColor('#8850ff')
    }

    if (score >= 2) {
      embed.setTitle('You are OMEGA gifted!')
        .setFooter(`${user.name} has a score of ${score}.`)
        .setColor('#50b2ff')
    }

    return message.channel.send(embed)
  }
}

/**
 * Clamp a value in a given range.
 *
 * Function taken from @studiometa/js-toolkit
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
function clamp (value, min, max) {
  return min < max
    ? value < min
      ? min
      : value > max
        ? max
        : value
    : value < max
      ? max
      : value > min
        ? min
        : value
}
