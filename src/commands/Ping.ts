import { Client, Message, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'

export default class Ping implements BaseDiscordCommand {
  name = 'ping'
  arguments = []
  description = 'Get latency info'
  category = 'general'

  client = null
  embed = new MessageEmbed()

  constructor (client: Client) {
    this.client = client
  }

  /**
   * @param {module:discord.js.Message} message
   */
  async run (message: Message): Promise<Message> {
    this.embed
      .setTitle(`Bot Latency is ${Date.now() - message.createdTimestamp}ms`)
      .setDescription(`Discord Latency is ${Math.round(this.client.ws.ping)}ms`)

    return message.channel.send(this.embed)
  }
}
