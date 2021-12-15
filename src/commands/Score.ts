import { Message, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import getEmoji from '../utils/getEmoji'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

export default class ScoreCommand implements BaseDiscordCommand {
  name = 'score'
  arguments = ['username']
  description = 'Get the old and new score count of a player'
  category = 'osu'

  async run (message: Message, args: string[]): Promise<Message> {
    try {
      const user = await getUser({ message, args })

      if (!user) {
        return message.channel.send(notFoundEmbed)
      }

      const intl = new Intl.NumberFormat('en-US')

      const description = `
        ${getEmoji('xh')} ${user.counts.SSH} (+-x)
        ${getEmoji('x')} ${user.counts.SS} (+-x)
        ${getEmoji('sh')} ${user.counts.SH} (+-x)
        ${getEmoji('s')} ${user.counts.S} (+-x)
        ${getEmoji('a')} ${user.counts.A} (+-x)
      `.trim()

      const embed = new MessageEmbed()
        .setTitle(`${user.name}'s scores`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .setDescription(description)
        .addField('Ranked score', `${intl.format(user.scores.ranked)}`, true)
        .addField('Total score', `${intl.format(user.scores.total)}`, true)
        .addField('Delta Ranked', 'wip', true)
        .addField('Delta Total', 'wip', true)
        .setColor(11279474)

      message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle('Player not found')
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}
