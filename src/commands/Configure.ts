/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MessageEmbed, Message, GuildMember, CommandInteraction, MessageActionRow, MessageSelectMenu, Guild, SelectMenuInteraction } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { defaultPrefix } from '../config'
import prefixes from '../libs/prefixes'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import { GuildColumns, GuildRow } from '../types/db'

export default class ConfigureCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure your server')

  FIVE_MINUTES = 5 * 60 * 1000

  choices = [
    {
      label: 'Top plays tracking',
      value: 'enable_track',
      emoji: '👀',
      description: 'Set a channel to track top plays',
      embed: new MessageEmbed()
        .setTitle('👀 Top plays tracking')
        .setDescription(
          'To enable top plays tracking mention the channel you want to send the top plays to.\nExample : `#track`\nDeactivate top plays tracking : `false`'
        )
        .setFooter({
          text: 'Please mention the track #channel or  `false` to deactivate'
        })
    },
    {
      label: 'Send new ranked beatmaps',
      value: 'enable_beatmaps_track',
      emoji: '📰',
      description: 'Set a channel to track new ranked beatmaps',
      embed: new MessageEmbed()
        .setTitle('📰 Send new ranked beatmaps')
        .setDescription(
          'To enable beatmaps tracking mention the channel you want to send new beatmaps to.\nExample : `#new-beatmaps`\nDeactivate beatmaps tracking : `false`'
        )
        .setFooter({
          text: 'Please mention the track #channel or  `false` to deactivate'
        })
    },
    {
      label: 'Daily osu!track updates',
      value: 'enable_updates',
      emoji: '🆕',
      description: 'Set a channel for daily updates',
      embed: new MessageEmbed()
        .setTitle('🆕 Daily osu!track updates')
        .setDescription(
          'To enable daily osu!track updates mention the channel you want to send the updates to.\nExample : `#updates`\nDeactivate daily updates : `false`'
        )
        .setFooter({
          text: 'Please mention the updates #channel or  `false` to deactivate'
        })
    },
    {
      label: 'Replay tracking',
      value: 'enable_replay',
      emoji: '▶️',
      description: 'Set a channel for replay tracking',
      embed: new MessageEmbed()
        .setTitle('▶️ Replay tracking')
        .setDescription(
          'To enable o!rdr replay tracking mention the channel you want to send the replays to.\nExample : `#replays`\nDeactivate replays tracking : `false`'
        )
        .setFooter({
          text: 'Please mention the replays #channel or  `false` to deactivate'
        })
    },
    {
      label: 'Bot prefix',
      value: 'change_prefix',
      emoji: '❗',
      description: 'Custom prefix for your server',
      embed: new MessageEmbed()
        .setTitle('❗ Bot prefix')
        .setDescription(
          'To set a new prefix type the prefix you want to use.\nExample : `>`'
        )
        .setFooter({ text: 'Please type the new prefix' })
    },
    {
      label: 'Track requests',
      value: 'enable_track_requests',
      emoji: '✅',
      description: 'Is members allowed to send track requests ?',
      embed: new MessageEmbed()
        .setTitle('✅ Track requests')
        .setDescription(
          'If you want to allow members to send track requests to an admin channel, mention the channel you want to send the requests to.\nIf you want to deactivate requests type `false`\n\nExample : `#admin-channel`\nDeactivate requests : `false`'
        )
        .setFooter({
          text: 'Please type either a #channel or  `false` to deactivate requests'
        })
    },
    {
      label: 'I am done !',
      value: 'finished',
      emoji: '👍',
      description: "I'm done editing my server settings"
    }
  ]

  row = new MessageActionRow()

  /**
   * Creates the menu for the select command
   */
  constructor () {
    this.row.addComponents(
      new MessageSelectMenu()
        .setCustomId('configure-actions')
        .setPlaceholder('I want to configure...')
        .addOptions(this.choices)
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
      .upsert({
        guild_id: guildId,
        [setting]: value
      })
      .eq('guild_id', guildId)

    if (error) {
      throw new Error(`${error.code}: ${error.message}`)
    }
  }

  async handleSelect (interaction: SelectMenuInteraction): Promise<void> {
    try {
      await interaction.deferUpdate()
      const [value] = interaction.values
      const choice = this.choices.find((c) => c.value === value)

      if (value === 'finished') {
        return interaction.reply(
          `See you next time ${interaction.user.username} ! :wave:`
        )
      }

      await interaction.channel.send({
        embeds: [choice.embed],
        components: [],
        content: null
      })

      // Delete the interaction select

      const filter = (message: Message) => message.member.id === interaction.user.id

      try {
        // Await for the user to send the value requested
        const collected = await interaction.channel.awaitMessages({
          filter,
          time: 15000,
          errors: ['time'],
          max: 1
        })

        const message = collected.first()

        if (!message) {
          throw new Error('User did not send a value.')
        }

        const response = new MessageEmbed()
          .setTitle(`✅ ${choice.label} updated`)
          .setColor(6867286)

        if (value === 'enable_track') {
          if (message.mentions.channels.size > 0) {
            const channel = message.mentions.channels.first()

            await this.updateGuildSetting(
              'track_channel',
              channel.id,
              message.guild.id
            )

            response.setDescription(
              `Top plays will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (message.content === 'false') {
            await this.updateGuildSetting('track_channel', null, message.guild.id)
            response.setDescription('Top plays tracking are now deactivated')
            response.setColor(14504273)
          }
        }

        if (value === 'enable_beatmaps_track') {
          if (message.mentions.channels.size > 0) {
            const channel = message.mentions.channels.first()

            await this.updateGuildSetting(
              'beatmaps_channel',
              channel.id,
              message.guild.id
            )

            response.setDescription(
              `New ranked beatmaps will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate tracking
          if (message.content === 'false') {
            await this.updateGuildSetting('beatmaps_channel', null, message.guild.id)
            response.setDescription('Beatmaps tracking is now deactivated')
            response.setColor(14504273)
          }
        }

        if (value === 'enable_updates') {
          if (message.mentions.channels.size > 0) {
            const channel = message.mentions.channels.first()

            await this.updateGuildSetting(
              'updates_channel',
              channel.id,
              message.guild.id
            )

            response.setDescription(
              `Daily updates will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (message.content === 'false') {
            await this.updateGuildSetting(
              'updates_channel',
              null,
              message.guild.id
            )
            response.setDescription('Daily updates are now deactivated')
            response.setColor(14504273)
          }
        }

        if (value === 'enable_replay') {
          if (message.mentions.channels.size > 0) {
            const channel = message.mentions.channels.first()

            await this.updateGuildSetting(
              'replay_channel',
              channel.id,
              message.guild.id
            )

            response.setDescription(
              `Replays will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (message.content === 'false') {
            await this.updateGuildSetting(
              'replay_channel',
              null,
              message.guild.id
            )
            response.setDescription('Replays tracking are now deactivated')
            response.setColor(14504273)
          }
        }

        if (value === 'change_prefix') {
          const newPrefix = message.content.trim() || defaultPrefix

          await this.updateGuildSetting('prefix', newPrefix, message.guild.id)

          prefixes.set(message.guild.id, newPrefix)

          response.setDescription(
            `New prefix is now : \`${newPrefix}\`\n(Example : \`${newPrefix}help\`)`
          )
        }

        if (value === 'enable_track_requests') {
          // if a channel is provided, enable track requests
          if (message.mentions.channels.size > 0) {
            const channel = message.mentions.channels.first()

            await this.updateGuildSetting(
              'admin_channel',
              channel.id,
              message.guild.id
            )

            response.setDescription(
              `Members requests will now be sent to ${channel.toString()}`
            )
          }

          // Else deactivate requests
          if (message.content === 'false') {
            await this.updateGuildSetting('admin_channel', null, message.guild.id)
            response.setDescription('Requests are now deactivated')
            response.setColor(14504273)
          }
        }

        // Send success message
        const settingsEmbed = await this.getSettingsEmbed(interaction.guild)
        await message.channel.send({
          embeds: [response, settingsEmbed]
        })
      } catch {
        // User did not send a value
        const embed = new MessageEmbed()
          .setTitle(`❌ Error : ${choice.label}`)
          .setDescription(
            'You did not type a correct value. This operation has been canceled.'
          )
          .setColor(14504273)

        interaction.channel.send({ embeds: [embed] })
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

    if (error) {
      console.error('getSettingsEmbed error', error)
      return new MessageEmbed()
        .setDescription(error.message)
    }

    if (!error) {
      const {
        track_channel,
        updates_channel,
        replay_channel,
        admin_channel,
        beatmaps_channel,
        prefix
      } = guildData

      const embed = new MessageEmbed()
        .setTitle(`${guild.name}'s settings`)
        .addField(
          'Track Top Plays',
          `${track_channel ? '✅' : '❌'} ${
            track_channel ? `<#${track_channel}>` : 'No channel set.'
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
          'Daily Updates',
          `${updates_channel ? '✅' : '❌'} ${
            updates_channel ? `<#${updates_channel}>` : 'No channel set.'
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
        .addField(
          'Track requests',
          `${admin_channel ? '✅' : '❌'} ${
            admin_channel ? `<#${admin_channel}>` : 'No channel set.'
          }`,
          true
        )
        .addField('Prefix', `${prefix || defaultPrefix}`)

      return embed
    }
  }

  async run (interaction: CommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember

    if (!member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'You need to be an Administrator to use this command.',
        ephemeral: true
      })
    }

    const settingsEmbed = await this.getSettingsEmbed(interaction.guild)

    return interaction.reply({
      content: `What do you want to do ${interaction.user.username} ?`,
      components: [this.row],
      embeds: [settingsEmbed]
    })
  }
}
