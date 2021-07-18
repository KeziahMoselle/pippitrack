import { MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import untrackUser from '../utils/untrackUser'

export default class UntrackCommand {
  name = 'untrack'
  arguments = ['username']
  description = 'Allows you to untrack a player'
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

    // Check if the author has the permission to untrack the user
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply('You need to be an Administrator to untrack players.')
    }

    try {
      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('id')
        .eq('osu_id', user.id)
        .eq('guild_id', message.guild.id)
        .single()

      if (!userFound) {
        const embed = new MessageEmbed()
          .setTitle(`${user.name} is not tracked.`)

        return message.channel.send(embed)
      }

      await untrackUser(userFound.id)

      const embed = new MessageEmbed()
        .setTitle(`${user.name} is no longer being tracked.`)

      message.channel.send(embed)
    } catch (error) {
      console.error(error)
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${args.join(' ')}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}
