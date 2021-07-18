import { MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'

interface ChannelToAddInterface {
  track_channel?: number;
  replay_channel?: number;
  admin_channel?: number;
}

export default class SetChannelCommand {
  name = 'set'
  arguments = ['type']
  description = 'Set channels for tracking performance, replays and administration'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const [type] = args

    if (!type) {
      const embed = new MessageEmbed()
        .setDescription(
          'Type `!set track` in your tracking channel to enable auto update and top plays tracking.\n' +
          'Type `!set replay` in your replay channel to enable replay posting from o!rdr.\n' +
          'Type `!set admin` in your administration channel to enable tracking requests from users. (if this is not set users can track themselves)'
        )
        .setColor(5814783)

      return message.channel.send(embed)
    }

    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply('You need to be an Administrator to use this command.')
    }

    const channelToAdd: ChannelToAddInterface = {}

    if (type === 'track') {
      channelToAdd.track_channel = message.channel.id
    }

    if (type === 'replay') {
      channelToAdd.replay_channel = message.channel.id
    }

    if (type === 'admin') {
      channelToAdd.admin_channel = message.channel.id
    }

    try {
      const { error } = await supabase
        .from('guilds')
        .upsert({
          guild_id: message.guild.id,
          ...channelToAdd
        })
        .eq('guild_id', message.guild.id)

      if (error) {
        message.reply('Sorry, there was an error')
      }

      const embed = new MessageEmbed()
        .setDescription(`Successfully set the ${type} channel on ${message.channel}`)
        .setColor(11279474)

      message.channel.send(embed)
    } catch (error) {
      console.error(error)
    }
  }
}
