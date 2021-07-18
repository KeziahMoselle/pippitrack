import { MessageEmbed } from 'discord.js'

export default class Ping {
  name = 'ping'
  arguments = []
  description = 'Get latency info'
  category = 'general'

  client = null
  embed = new MessageEmbed()

  constructor (client) {
    this.client = client
  }

  /**
   * @param {module:discord.js.Message} message
   */
  async run (message) {
    this.embed
      .setTitle(`Latency is ${Date.now() - message.createdTimestamp}ms`)
      .setDescription(`API Latency is ${Math.round(this.client.ws.ping)}ms`)

    return message.channel.send(this.embed)
  }
}
