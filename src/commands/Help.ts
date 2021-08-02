import { Message, MessageEmbed } from 'discord.js'
import { defaultPrefix } from '../config'
import prefixes from '../libs/prefixes'
import { BaseDiscordCommand } from '../types'

export default class Help implements BaseDiscordCommand {
  name = 'help'
  arguments = []
  description = 'Display a help message'
  category = 'general'

  embed = new MessageEmbed()

  constructor () {
    this.embed
      .setTitle('Click to see the documentation')
      .setURL('https://github.com/KeziahMoselle/osu-track/')
      .addField(
        'Support Server',
        '[Join the support server](https://discord.gg/bNQUZeHFdR)'
      )
      .setColor(5814783)
  }

  async run (message: Message): Promise<Message> {
    const prefix = prefixes.get(message.guild.id) || defaultPrefix

    const description =
      `**Administrators** can configure the server by typing \`${prefix}config\`.\n` +
      `**Users** can link their Discord to an osu! profile by typing \`${prefix}u yourUsername\`\n\n` +
      `Current prefix is \`${prefix}\``

    this.embed.setDescription(description)
    return message.channel.send(this.embed)
  }
}
