import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { maxTrackedUsersInGuild } from '../config'
import { BaseDiscordCommand } from '../types'
import { TrackedUsersRow } from '../types/db'
import { SlashCommandBuilder } from '@discordjs/builders'

export default class TracklistCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('tracklist')
    .setDescription('Display the list of tracked users in the server.')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('The page number to display.')
        .setMinValue(1)
        .setMaxValue(5)
    )

  fetchPage (page: number, guildId: string) {
    let startIndex = 0
    let endIndex = 24

    if (page > 1) {
      startIndex = (startIndex + 1) * 25 * (page - 1)
      endIndex = (endIndex + 1) * page
    }

    return supabase
      .from<TrackedUsersRow>('tracked_users')
      .select('*', { count: 'exact' })
      .eq('guild_id', guildId)
      .range(startIndex, endIndex)
  }

  async getTotalCount (guildId: string): Promise<number> {
    const { count } = await supabase
      .from('tracked_users')
      .select('id', { count: 'exact' })
      .eq('guild_id', guildId)
    return count
  }

  roundUp (num: number, precision: number): number {
    precision = Math.pow(10, precision)
    return Math.ceil(num * precision) / precision
  }

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (interaction: CommandInteraction): Promise<void> {
    const page = interaction.options.getInteger('page') || 1

    // Check if the author has the permission to run this command
    const member = interaction.member as GuildMember
    if (!member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'You need to be an Administrator to use this command.',
        ephemeral: true
      })
    }

    try {
      const { data: trackedUsers, error } = await this.fetchPage(
        Number(page),
        interaction.guild.id
      )
      const totalCount = await this.getTotalCount(interaction.guild.id)

      if (error) {
        console.error(
          'Error at fetching tracklist page',
          error,
          interaction.guild.id
        )
        return interaction.reply(`Error while fetching page ${page}`)
      }

      if (trackedUsers.length === 0) {
        const embed = new MessageEmbed()
          .setTitle('There is no tracked users in this server')
          .setDescription('Start tracking by typing `/track username`')

        return interaction.reply({ embeds: [embed] })
      }

      const embed = new MessageEmbed()
        .setTitle(`List of tracked users in ${interaction.guild.name}`)
        .setFooter({
          text: `${totalCount} tracked users (max: ${maxTrackedUsersInGuild}) | Page ${page}/${this.roundUp(
            totalCount / 25,
            0
          )}`
        })
        .setColor(11279474)

      const description = trackedUsers.reduce((description, user) => {
        description += `${user.osu_username}\n`
        return description
      }, '')

      embed.setDescription(description)

      interaction.reply({ embeds: [embed] })
    } catch (error) {
      console.error(error)

      return interaction.reply(
        'An error occurred while trying to fetch the list of tracked users.'
      )
    }
  }
}
