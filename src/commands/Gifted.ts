import { Message, MessageEmbed } from 'discord.js'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { BaseDiscordCommand } from '../types'
import getOsuAvatar from '../utils/getOsuAvatar'

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
      .setAuthor(user.name, getOsuAvatar(user.id))

    if (score <= 0.5) {
      embed.setTitle('It seems you are enjoying the game.')
        .setFooter(`${user.name} has a score of ${score}.`)
        .setColor(11279474)
    }

    if (score > 0.5 && score < 1.3) {
      embed.setTitle('It seems you are pretty average.')
        .setFooter(`${user.name} has a score of ${score}.`)
        .setColor(11279474)
    }

    if (score >= 1.3 && score < 2) {
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
