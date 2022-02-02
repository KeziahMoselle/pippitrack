import { Message, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import getOsuAvatar from '../utils/getOsuAvatar'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

export default class LinkCommand implements BaseDiscordCommand {
  name = 'link'
  arguments = ['username']
  description = 'Link your Discord account to an osu! username'
  category = 'osu'

  async run (message: Message, args: string[]): Promise<Message> {
    try {
      const user = await getUser({ message, args })

      if (!user) {
        return message.channel.send(notFoundEmbed)
      }

      const embed = new MessageEmbed()
        .setTitle(`${message.member.displayName} has been set to ${user.name}`)
        .setThumbnail(getOsuAvatar(user.id))
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      const { data: isDiscordUserPresent } = await supabase
        .from('users')
        .select('discord_id')
        .eq('discord_id', message.author.id)

      // If the Discord ID is present, update instead of insert
      if (isDiscordUserPresent.length > 0) {
        const { error } = await supabase
          .from('users')
          .update({ osu_id: user.id })
          .eq('discord_id', message.author.id)

        if (error) {
          console.error(error)
          return message.reply('Sorry, there was an error.')
        }

        return message.channel.send(embed)
      }

      // Link the Discord ID to the osu id
      const { error } = await supabase.from('users').insert([
        {
          discord_id: message.author.id,
          osu_id: user.id
        }
      ])

      if (error) {
        console.error(error)
        return message.reply('Sorry, there was an error.')
      }

      message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle('Player not found')
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}
