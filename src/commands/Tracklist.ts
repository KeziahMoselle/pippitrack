import { MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'

export default class TracklistCommand {
  name = 'tracklist'
  arguments = ['page']
  description = 'Display the list of tracked users in the server.'
  category = 'osu'

  fetchPage (page, guildId) {
    let startIndex = 0
    let endIndex = 24

    if (page > 1) {
      startIndex = (startIndex + 1) * 25 * (page - 1)
      endIndex = (endIndex + 1) * page
    }

    return supabase
      .from('tracked_users')
      .select('*', { count: 'exact' })
      .eq('guild_id', guildId)
      .range(startIndex, endIndex)
  }

  async getTotalCount (guildId) {
    const { count } = await supabase
      .from('tracked_users')
      .select('id', { count: 'exact' })
      .eq('guild_id', guildId)
    return count
  }

  roundUp (num, precision) {
    precision = Math.pow(10, precision)
    return Math.ceil(num * precision) / precision
  }

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const [page = 1] = args

    // Check if the author has the permission to run this command
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        'You need to be an Administrator to use this command.'
      )
    }

    try {
      const { data: trackedUsers, error } = await this.fetchPage(
        page,
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

        return message.channel.send(embed)
      }

      const embed = new MessageEmbed()
        .setTitle(`List of tracked users in ${message.guild.name}`)
        .setFooter(
          `${totalCount} tracked users | Page ${page}/${this.roundUp(
            totalCount / 25,
            0
          )}`
        )
        .setColor(11279474)

      const description = trackedUsers.reduce((description, user) => {
        description += `${user.osu_username}\n`
        return description
      }, '')

      embed.setDescription(description)

      message.channel.send(embed)
    } catch (error) {
      console.error(error)

      return message.reply(
        'An error occurred while trying to fetch the list of tracked users.'
      )
    }
  }
}
