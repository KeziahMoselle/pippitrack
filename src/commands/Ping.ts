import { SlashCommandBuilder } from '@discordjs/builders'
import { Client, CommandInteraction, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'

export default class Ping implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Get latency info')

  client = null
  embed = new MessageEmbed()

  constructor (client: Client) {
    this.client = client
  }

  async run (interaction: CommandInteraction): Promise<void> {
    this.embed
      .setTitle(`Bot Latency is ${Date.now() - interaction.createdTimestamp}ms`)
      .setDescription(`Discord Latency is ${Math.round(this.client.ws.ping)}ms`)

    interaction.reply({ embeds: [this.embed] })
  }
}
