import { Message, MessageEmbed } from 'discord.js'

export default class Help {
  name = 'help'
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
    return message.channel.send(this.embed)
  }
}
