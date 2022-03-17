import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import osuTrack from '../libs/osutrack'
import { CommandInteraction } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { SlashCommandBuilder } from '@discordjs/builders'

export default class UpdateCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('update')
    .setDescription('See how much pp, rank, etc. you\'ve gained since your last update')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
    )

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')

    const user = await getUser({
      username,
      discordId: interaction.user.id
    })

    if (!user) {
      return interaction.reply({ embeds: [notFoundEmbed] })
    }

    try {
      const { embed, embedMessage } = await osuTrack.update(user)

      return interaction.reply({
        content: embedMessage,
        embeds: [embed]
      })
    } catch (error) {
      if (error.message === 'Cannot read property \'rank\' of undefined') {
        return interaction.reply({ embeds: [notFoundEmbed] })
      }
      console.error(error)
      interaction.reply(error.message)
    }
  }
}
