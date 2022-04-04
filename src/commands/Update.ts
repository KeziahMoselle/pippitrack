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
    .addStringOption((option) =>
      option.setName('mode')
        .setDescription('Game mode')
        .addChoice('Standard', 'osu')
        .addChoice('Catch The Beat', 'fruits')
        .addChoice('Taiko', 'taiko')
        .addChoice('Mania', 'mania')
    )

  async run (interaction: CommandInteraction): Promise<void> {
    try {
      await interaction.deferReply()
      const username = interaction.options.getString('username')
      const selectedMode = interaction.options.getString('mode')

      const { user, mode } = await getUser({
        username,
        discordId: interaction.user.id
      })

      if (!user) {
        interaction.editReply({ embeds: [notFoundEmbed] })
        return
      }

      const { embed, embedMessage } = await osuTrack.update({
        osuUser: user,
        mode: selectedMode || mode
      })

      interaction.editReply({
        content: embedMessage,
        embeds: [embed]
      })
    } catch (error) {
      if (error.message === 'Cannot read property \'rank\' of undefined') {
        interaction.editReply({ embeds: [notFoundEmbed] })
      }

      interaction.editReply({
        content: error.message
      })
    }
  }
}
