import { MessageEmbed, Message } from 'discord.js'
import supabase from '../libs/supabase'
import { maxTrackedUsersInGuild } from '../config'
import { BaseDiscordCommand } from '../types'
import { TrackedUsersRow } from '../types/db'

export default class TracklistCommand implements BaseDiscordCommand {
  name = 'tracklist'
  arguments = ['page']
  description = 'Display the list of tracked users in the server.'
  category = 'osu'

  fetchPage (page: number, guildId: string) {
    let startIndex = 0
    let endIndex = 24

    if (page > 1) {
      startIndex = (startIndex + 1) * 25 * (page - 1)
      endIndex = (endIndex + 1) * page
    }

    return supabase
      .from<TrackedUsersRow>('tracked_users')
      .select('*', { count: 'exact' })
      .eq('guild_id', guildId)
      .range(startIndex, endIndex)
  }

  async getTotalCount (guildId: string): Promise<number> {
    const { count } = await supabase
      .from('tracked_users')
      .select('id', { count: 'exact' })
      .eq('guild_id', guildId)
    return count
  }

  roundUp (num: number, precision: number): number {
    precision = Math.pow(10, precision)
    return Math.ceil(num * precision) / precision
  }

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message: Message, args: string[]): Promise<Message | Message[]> {
    const [page = 1] = args

    // Check if the author has the permission to run this command
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply(
        'You need to be an Administrator to use this command.'
      )
    }

    try {
      const { data: trackedUsers, error } = await this.fetchPage(
        Number(page),
        message.guild.id
      )
      const totalCount = await this.getTotalCount(message.guild.id)

      if (error) {
        console.error(
          'Error at fetching tracklist page',
          error,
          message.guild.id
        )
        return message.reply(`Error while fetching page ${page}`)
      }

      if (trackedUsers.length === 0) {
        const embed = new MessageEmbed()
          .setTitle('There is no tracked users in this server')
          .setDescription('Start tracking by typing `!track username`')

        return message.channel.send({ embeds: [embed] })
      }

      const embed = new MessageEmbed()
        .setTitle(`List of tracked users in ${message.guild.name}`)
        .setFooter({
          text: `${totalCount} tracked users (max: ${maxTrackedUsersInGuild}) | Page ${page}/${this.roundUp(
            totalCount / 25,
            0
          )}`
        })
        .setColor(11279474)

      const description = trackedUsers.reduce((description, user) => {
        description += `${user.osu_username}\n`
        return description
      }, '')

      embed.setDescription(description)

      message.channel.send({ embeds: [embed] })
    } catch (error) {
      console.error(error)

      return message.reply(
        'An error occurred while trying to fetch the list of tracked users.'
      )
    }
  }
}
