import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { SlashCommandBuilder } from '@discordjs/builders'
import supabase from '../libs/supabase'
import { UpdateRecordRow } from '../types/db'
import { osuApiV2 } from '../libs/osu'
import getEmoji from '../utils/getEmoji'
import { Score } from '../types/osu'
import getFlagEmoji from '../utils/getFlagEmoji'
import { update } from '../libs/update'

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
    .addIntegerOption((option) =>
      option.setName('index')
        .setDescription('Index, compare to an older update')
        .setMinValue(0)
        .setMaxValue(4))

  async run (interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply()
    const username = interaction.options.getString('username')
    const selectedMode = interaction.options.getString('mode')
    const rowIndex = interaction.options.getInteger('index') || 0

    try {
      const { embed, type, previousData } = await update({
        username,
        selectedMode,
        rowIndex,
        interaction
      })

      const unixTimestamp = Math.trunc(new Date(previousData?.created_at ?? 0).getTime() / 1000)

      await interaction.editReply({
        content: type === 'update'
          ? `Last update <t:${unixTimestamp}:R>`
          : undefined,
        embeds: [embed]
      })

      console.log(`${interaction.user.username}#${interaction.user.discriminator} used /update.`, {
        username,
        selectedMode,
        rowIndex
      })
    } catch (error) {
      console.error(`[ERROR] ${interaction.user.username}#${interaction.user.discriminator} used /update.`, {
        username,
        selectedMode,
        rowIndex
      }, error)

      const embed = new MessageEmbed()
        .setDescription(error.message)

      await interaction.editReply({
        embeds: [embed]
      })
    }
  }
}
