import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'

export default class Help implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get some information/links about the bot')

  embed = new MessageEmbed()

  constructor () {
    this.embed
      .setTitle('Click to see the documentation')
      .setURL('https://pippitrack.com/')
      .addField(
        'Support Server',
        '[Join the support server](http://discord.pippitrack.com/)',
        true
      )
      .addField(
        'Source Code',
        '[GitHub repository](https://github.com/KeziahMoselle/osu-track/)',
        true
      )
      .setColor(5814783)
  }

  async run (interaction: CommandInteraction): Promise<void> {
    const description =
      '**Administrators** can configure the server by typing `/configure`.\n' +
      '**Users** can link their Discord to an osu! profile by typing `/link yourUsername`'

    this.embed.setDescription(description)
    interaction.reply({ embeds: [this.embed] })
  }
}
