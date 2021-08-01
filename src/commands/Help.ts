import { Message, MessageEmbed } from 'discord.js'
import { defaultPrefix } from '../config'
import prefixes from '../libs/prefixes'

export default class Help {
  name = 'help'
  arguments = []
  description = 'Display a help message'
  category = 'general'

  embed = new MessageEmbed()

  constructor () {
    this.embed
      .setTitle('Click to see the documentation')
      .setURL('https://github.com/KeziahMoselle/osu-track/')
      .setColor(5814783)
  }

  /**
   * @param {module:discord.js.Message} message
   */
  async run (message: Message): Promise<Message> {
    const prefix = prefixes.get(message.guild.id) || defaultPrefix

    let description = `Current prefix : \`${prefix}\``

    if (message.member.hasPermission('ADMINISTRATOR')) {
      description += `\nHey there administrator ! If you want to configure your server type \`${prefix}config\` !`
    }

    this.embed.setDescription(description)
    return message.channel.send(this.embed)
  }
}
