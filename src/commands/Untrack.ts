import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import untrackUser from '../utils/untrackUser'

export default class UntrackCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('untrack')
    .setDescription('Allows you to untrack a player or the entire server.')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('all')
        .setDescription('Untrack all players')
    )

  async untrackAll (interaction: CommandInteraction): Promise<void> {
    const { count } = await supabase
      .from('tracked_users')
      .select('id', { count: 'exact' })
      .eq('guild_id', interaction.guild.id)

    if (count === 0) {
      const embed = new MessageEmbed().setDescription(
        'This server has no tracked player!'
      )

      return interaction.reply({ embeds: [embed] })
    }

    const { data: untrackedUsers, error } = await supabase
      .from('tracked_users')
      .delete()
      .eq('guild_id', interaction.guild.id)

    if (error) {
      console.error('handleUntrackBtn error :', error)
      return interaction.reply({
        content: 'Sorry, there was an error.',
        ephemeral: true
      })
    }

    const embed = new MessageEmbed()
      .setTitle(
      `Successfully untracked ${untrackedUsers.length} player${
        untrackedUsers.length > 1 ? 's' : ''
      }.`
      )
      .setColor(6867286)

    interaction.reply({ embeds: [embed] })
  }

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')
    const all = interaction.options.getBoolean('all')

    if (all) {
      return this.untrackAll(interaction)
    }

    if (!username) {
      return interaction.reply({ embeds: [notFoundEmbed] })
    }

    const user = await getUser({
      username
    })

    // Check if the author has the permission to untrack the user
    const member = interaction.member as GuildMember

    if (!member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'You need to be an Administrator to untrack players.',
        ephemeral: true
      })
    }

    try {
      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('id')
        .eq('osu_id', user.id)
        .eq('guild_id', interaction.guild.id)
        .single()

      if (!userFound) {
        const embed = new MessageEmbed().setTitle(
          `${user.name} is not tracked.`
        )

        return interaction.reply({ embeds: [embed] })
      }

      await untrackUser(userFound.id)

      const embed = new MessageEmbed().setTitle(
        `${user.name} is no longer being tracked.`
      )

      interaction.reply({ embeds: [embed] })
    } catch (error) {
      if (error.message === 'Cannot read property \'rank\' of undefined') {
        return interaction.reply({ embeds: [notFoundEmbed] })
      }

      console.error(error)
      const embed = new MessageEmbed()
        .setDescription(error.message)

      return interaction.reply({ embeds: [embed] })
    }
  }
}
