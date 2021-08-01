import { MessageButton } from 'discord-buttons'
import { Message, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import untrackUser from '../utils/untrackUser'

export default class UntrackCommand {
  name = 'untrack'
  arguments = ['username']
  description = 'Allows you to untrack a player'
  category = 'osu'

  async untrackAll (message: Message): Promise<Message | Message[]> {
    const { count } = await supabase
      .from('tracked_users')
      .select('id', { count: 'exact' })
      .eq('guild_id', message.guild.id)

    if (count === 0) {
      const embed = new MessageEmbed().setDescription(
        'This server has no tracked player!'
      )

      return message.channel.send(embed)
    }

    let secondsBeforeCancel = 10

    const embed = new MessageEmbed()
      .setDescription(
        `Do you really want to untrack **${count}** player${
          count > 1 ? 's' : ''
        } tracked on this server ?`
      )
      .setFooter(`You have ${secondsBeforeCancel}s to confirm this action.`)
      .setColor(14504273)

    const untrackAllBtn = new MessageButton()
      .setStyle('red')
      .setLabel(`Untrack ${count} player${count > 1 ? 's' : ''}`)
      .setID(`untrackall_${message.guild.id}_${message.author.id}`)

    const sentMessage = (await message.channel.send(
      embed,
      untrackAllBtn
    )) as Message

    const interval = setInterval(() => {
      if (sentMessage.embeds[0]?.title?.includes('Successfully')) {
        clearInterval(interval)
        return sentMessage
      }
      secondsBeforeCancel -= 2

      if (secondsBeforeCancel <= 0) {
        clearInterval(interval)
        sentMessage.delete()
      } else {
        const newEmbed = embed.setFooter(
          `You have ${secondsBeforeCancel}s to confirm this action.`
        )
        sentMessage.edit(newEmbed)
      }
    }, 2000)

    return sentMessage
  }

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message: Message, args: string[]): Promise<Message | Message[]> {
    if (args.includes('-all')) {
      return this.untrackAll(message)
    }

    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
    }

    // Check if the author has the permission to untrack the user
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        'You need to be an Administrator to untrack players.'
      )
    }

    try {
      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('id')
        .eq('osu_id', user.id)
        .eq('guild_id', message.guild.id)
        .single()

      if (!userFound) {
        const embed = new MessageEmbed().setTitle(
          `${user.name} is not tracked.`
        )

        return message.channel.send(embed)
      }

      await untrackUser(userFound.id)

      const embed = new MessageEmbed().setTitle(
        `${user.name} is no longer being tracked.`
      )

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
