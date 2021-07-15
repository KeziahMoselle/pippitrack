const { MessageEmbed } = require('discord.js')
const supabase = require('../libs/supabase')

class SetChannelCommand {
  name = 'set'
  arguments = ['type']
  description = 'Set tracking channels'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const [type] = args

    if (!type) {
      return message.reply('You need to specify a type of channel to set.\nEither `track` or `replay`.')
    }

    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply('You need to be an Administrator to use this command.')
    }

    const channelToAdd = {}

    if (type === 'track') {
      channelToAdd.track_channel = message.channel.id
    }

    if (type === 'replay') {
      channelToAdd.replay_channel = message.channel.id
    }
    try {
      const { data, error } = await supabase
        .from('guilds')
        .upsert({
          guild_id: message.guild.id,
          ...channelToAdd
        })
        .eq('guild_id', message.guild.id)

      console.log(data, error)

      const embed = new MessageEmbed()
        .setDescription(`Successfully set the ${type} channel on ${message.channel}`)
        .setColor(11279474)

      message.channel.send(embed)
    } catch (error) {
      console.error(error)
    }
  }
}

module.exports = SetChannelCommand
