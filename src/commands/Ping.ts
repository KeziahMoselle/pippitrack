import { Client, Message, MessageEmbed } from 'discord.js'

export default class Ping {
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
      .setTitle(`Latency is ${Date.now() - message.createdTimestamp}ms`)
      .setDescription(`API Latency is ${Math.round(this.client.ws.ping)}ms`)

    return message.channel.send(this.embed)
  }
}
