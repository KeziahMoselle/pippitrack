import { Message, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import { UsersStateRow } from '../types/db'
import getEmoji from '../utils/getEmoji'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

const intl = new Intl.NumberFormat('en-US')

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

      let hasData = true
      let deltaRankedScore = 0
      let deltaTotalScore = 0

      const { data } = await supabase
        .from<UsersStateRow>('users_state')
        .select('ranked_score, total_score')
        .eq('osu_id', user.id)
        .single()

      if (!data.ranked_score || !data.total_score) {
        hasData = false
      }

      if (hasData) {
        deltaRankedScore = user.scores.ranked - data.ranked_score
        deltaTotalScore = user.scores.total - data.total_score
      }

      const description = `
      **▸ Ranks:** ${getEmoji('xh')} \`${user.counts.SSH}\` ${getEmoji('x')} \`${user.counts.SS}\` ${getEmoji('sh')} \`${user.counts.SH}\` ${getEmoji('s')} \`${user.counts.S}\` ${getEmoji('a')} \`${user.counts.A}\`\n**▸ Level:** ${user.level}
      `.trim()

      const embed = new MessageEmbed()
        .setTitle(`${user.name}'s scores`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .setDescription(description)
        .addField('Ranked score', `
          ${intl.format(user.scores.ranked)}
          ${deltaRankedScore > 0 ? `(+${intl.format(user.scores.ranked - data.ranked_score)})` : ''}
        `, true)
        .addField('Total score', `
          ${intl.format(user.scores.total)}
          ${deltaTotalScore > 0 ? `(+${intl.format(user.scores.total - data.total_score)})` : ''}
        `, true)
        .setColor(11279474)

      message.channel.send(embed)

      await supabase
        .from<UsersStateRow>('users_state')
        .upsert({
          osu_id: user.id.toString(),
          last_updated: new Date(),
          ranked_score: user.scores.ranked,
          total_score: user.scores.total
        })
        .eq('osu_id', user.id.toString())
    } catch {
      const embed = new MessageEmbed()
        .setTitle('Player not found')
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}
