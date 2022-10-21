/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MessageEmbed, GuildMember, CommandInteraction, MessageActionRow, MessageSelectMenu, Guild, GuildBasedChannel } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { defaultPrefix } from '../config'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import { GuildColumns, GuildRow } from '../types/db'

const CHOICES = [
  {
    label: 'Daily osu!track updates',
    value: 'enable_updates',
    emoji: '🆕',
    description: 'Set a channel for daily updates'
  },
  {
    label: 'Send new ranked beatmaps',
    value: 'enable_beatmaps_track',
    emoji: '📰',
    description: 'Set a channel to track new ranked beatmaps'
  },
  {
    label: 'Top plays tracking',
    value: 'enable_track',
    emoji: '👀',
    description: 'Set a channel to track top plays'
  },
  {
    label: 'Replay tracking',
    value: 'enable_replay',
    emoji: '▶️',
    description: 'Set a channel for replay tracking'
  }
]

export default class ConfigureCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure your server')
    .addStringOption((option) => {
      option.setName('choice')
        .setDescription('Select what you want to configure.')
        .setRequired(true)

      CHOICES.forEach((choice) => {
        option.addChoice(choice.label, choice.value)
      })

      return option
    })
    .addChannelOption(option => option.setName('channel').setDescription('Channel or empty to deactivate'))

  FIVE_MINUTES = 5 * 60 * 1000

  row = new MessageActionRow()

  /**
   * Creates the menu for the select command
   */
  constructor () {
    this.row.addComponents(
      new MessageSelectMenu()
        .setCustomId('configure-actions')
        .setPlaceholder('I want to configure...')
        .addOptions(CHOICES)
    )
  }

  /**
   * Utility to update a column in the database
   */
  async updateGuildSetting (
    setting: GuildColumns,
    value: string,
    guildId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('guilds')
      .update({
        [setting]: value
      })
      .eq('guild_id', guildId)

    if (error) {
      throw new Error(`${error.code}: ${error.message}`)
    }
  }

  async handleSelect (interaction: CommandInteraction, choiceName: string, channel: GuildBasedChannel): Promise<void> {
    const choice = CHOICES.find((c) => c.value === choiceName)

    try {
      // Delete the interaction select
      try {
        const response = new MessageEmbed()
          .setTitle(`✅ ${choice.label} updated`)
          .setColor(6867286)

        // Test if bot can send messages in the desired channel
        if (channel) {
          try {
            const embed = new MessageEmbed()
              .setDescription(`✅ "**${choice.label}**" set in this channel.`)
              .setColor(6867286)

            if (channel.isText()) {
              await channel.send({
                embeds: [embed]
              })
            } else {
              const embed = new MessageEmbed()
                .setDescription('❌ Channel is not a text channel.')
                .setColor(14504273)

              return interaction.reply({
                embeds: [embed]
              })
            }
          } catch (error) {
            const embed = new MessageEmbed()
              .setDescription(`❌ Can't send messages in <#${channel}>`)
              .setColor(14504273)

            interaction.reply({
              embeds: [embed]
            })

            return
          }
        }

        if (choice.value === 'enable_track') {
          if (channel) {
            await this.updateGuildSetting(
              'track_channel',
              channel.id,
              interaction.guildId
            )

            response.setDescription(
              `Top plays will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (!channel) {
            await this.updateGuildSetting('track_channel', null, interaction.guildId)
            response.setDescription('Top plays tracking are now deactivated')
            response.setColor(14504273)
          }
        }

        if (choice.value === 'enable_beatmaps_track') {
          if (channel) {
            await this.updateGuildSetting(
              'beatmaps_channel',
              channel.id,
              interaction.guildId
            )

            response.setDescription(
              `New ranked beatmaps will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate tracking
          if (!channel) {
            await this.updateGuildSetting('beatmaps_channel', null, interaction.guildId)
            response.setDescription('Beatmaps tracking is now deactivated')
            response.setColor(14504273)
          }
        }

        if (choice.value === 'enable_updates') {
          if (channel) {
            await this.updateGuildSetting(
              'updates_channel',
              channel.id,
              interaction.guildId
            )

            response.setDescription(
              `Daily updates will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (!channel) {
            await this.updateGuildSetting(
              'updates_channel',
              null,
              interaction.guildId
            )
            response.setDescription('Daily updates are now deactivated')
            response.setColor(14504273)
          }
        }

        if (choice.value === 'enable_replay') {
          if (channel) {
            await this.updateGuildSetting(
              'replay_channel',
              channel.id,
              interaction.guildId
            )

            response.setDescription(
              `Replays will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (!channel) {
            await this.updateGuildSetting(
              'replay_channel',
              null,
              interaction.guildId
            )
            response.setDescription('Replays tracking are now deactivated')
            response.setColor(14504273)
          }
        }

        // Send success message
        const settingsEmbed = await this.getSettingsEmbed(interaction.guild)
        await interaction.reply({
          embeds: [response, settingsEmbed]
        })
      } catch (error) {
        // User did not send a value
        const embed = new MessageEmbed()
          .setTitle('⭕ Sorry there was an error.')
          .setColor(14504273)

        console.error(error)

        interaction.reply({ embeds: [embed] })
      }
    } catch (error) {
      console.error('getSettingsEmbed error', error)
      await interaction.channel.send({
        embeds: [
          new MessageEmbed()
            .setDescription(error.message)
        ]
      })
    }
  }

  /**
   * Sends the menu to the user
   */
  async getSettingsEmbed (guild: Guild): Promise<MessageEmbed> {
    const { data: guildData, error } = await supabase
      .from<GuildRow>('guilds')
      .select('*')
      .eq('guild_id', guild.id)
      .single()

    // First time using this command in a guild
    if (error) {
      await supabase.from<GuildRow>('guilds')
        .insert({
          guild_id: guild.id
        })

      const embed = new MessageEmbed()
        .setTitle(`${guild.name}'s settings`)
        .addField(
          'Daily Updates',
          '❌ No channel set.',
          true
        )
        .addField(
          'Track Beatmaps',
          '❌ No channel set.',
          true
        )
        .addField(
          'Track Top Plays',
          '❌ No channel set.',
          true
        )
        .addField(
          'Track o!rdr replays',
          '❌ No channel set.',
          true
        )
      return embed
    }

    if (!error) {
      const {
        track_channel,
        updates_channel,
        replay_channel,
        beatmaps_channel,
        prefix
      } = guildData

      const embed = new MessageEmbed()
        .setTitle(`${guild.name}'s settings`)
        .addField(
          'Daily Updates',
          `${updates_channel ? '✅' : '❌'} ${
            updates_channel ? `<#${updates_channel}>` : 'No channel set.'
          }`,
          true
        )
        .addField(
          'Track Beatmaps',
          `${beatmaps_channel ? '✅' : '❌'} ${
            beatmaps_channel ? `<#${beatmaps_channel}>` : 'No channel set.'
          }`,
          true
        )
        .addField(
          'Track Top Plays',
          `${track_channel ? '✅' : '❌'} ${
            track_channel ? `<#${track_channel}>` : 'No channel set.'
          }`,
          true
        )
        .addField(
          'Track o!rdr replays',
          `${replay_channel ? '✅' : '❌'} ${
            replay_channel ? `<#${replay_channel}>` : 'No channel set.'
          }`,
          true
        )
        .addField('Prefix (will be deprecated)', `${prefix || defaultPrefix}`)

      return embed
    }
  }

  async run (interaction: CommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember

    const choice = interaction.options.getString('choice')
    const channel = interaction.options.getChannel('channel')

    if (!member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'You need to be an Administrator to use this command.',
        ephemeral: true
      })
    }

    this.handleSelect(interaction, choice, channel as GuildBasedChannel)
  }
}
