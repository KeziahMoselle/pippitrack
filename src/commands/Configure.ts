/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  InteractionReply,
  MessageComponent,
  MessageMenu,
  MessageMenuOption
} from 'discord-buttons'
import { MessageEmbed, Message } from 'discord.js'
import { defaultPrefix } from '../config'
import prefixes from '../libs/prefixes'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import { GuildColumns, GuildRow } from '../types/db'

export default class ConfigureCommand implements BaseDiscordCommand {
  name = 'config'
  arguments = []
  description = 'Configure your server'
  category = 'general'
  prefixes = null

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
          'To enable top plays tracking mention the channel you want to send the top plays to.\nExample : `#track`'
        )
        .setFooter('Please mention the track #channel')
    },
    {
      label: 'Daily osu!track updates',
      value: 'enable_updates',
      emoji: '🆕',
      description: 'Set a channel for daily updates',
      embed: new MessageEmbed()
        .setTitle('🆕 Daily osu!track updates')
        .setDescription(
          'To enable daily osu!track updates mention the channel you want to send the updates to.\nExample : `#updates`'
        )
        .setFooter('Please mention the updates #channel')
    },
    {
      label: 'Replay tracking',
      value: 'enable_replay',
      emoji: '▶️',
      description: 'Set a channel for replay tracking',
      embed: new MessageEmbed()
        .setTitle('▶️ Replay tracking')
        .setDescription(
          'To enable o!rdr replay tracking mention the channel you want to send the replays to.\nExample : `#replays`'
        )
        .setFooter('Please mention the replays #channel')
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
        .setFooter('Please type the new prefix')
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
        .setFooter(
          'Please type either a #channel or  `false` to deactivate requests'
        )
    },
    {
      label: 'I am done !',
      value: 'finished',
      emoji: '👍',
      description: "I'm done editing my server settings"
    }
  ]

  select = null

  /**
   * Creates the menu for the select command
   */
  constructor () {
    this.select = new MessageMenu()
      .setID('configmenu')
      .setPlaceholder('I want to configure...')
      .setMaxValues(1)
      .setMinValues(1)

    for (const choice of this.choices) {
      const option = new MessageMenuOption()
        .setLabel(choice.label)
        .setEmoji(choice.emoji)
        .setValue(choice.value)
        .setDescription(choice.description)

      this.select.addOption(option)
    }
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

  /**
   * After clicking on a menu option :
   * 1. Check permissions of the clicker
   * 2. Send the option embed
   * 3. Await for the new value
   * 4. Update the value in the database
   * 5. Send the menu again if the user wants to change something else
   */
  async handleMenuCollector (
    menu: MessageComponent,
    authorId: string
  ): Promise<Message | InteractionReply> {
    // Check permission
    if (!menu.clicker.member.hasPermission('ADMINISTRATOR')) {
      return menu.reply.send(
        'You need to be an Administrator to use this command.',
        // @ts-ignore
        true
      )
    }

    // Only the original author is allowed to interact
    if (menu.clicker.id !== authorId) {
      // @ts-ignore
      return menu.reply.send('You are not the author of the message.', true)
    }

    // @ts-ignore
    menu.reply.defer()

    // Take the option to change
    const [value] = menu.values
    const choice = this.choices.find((c) => c.value === value)

    if (value === 'finished') {
      menu.message.channel.send(
        `See you next time ${menu.clicker.member.displayName} ! :wave:`
      )

      return menu.message.delete()
    }

    // Delete the menu select
    menu.message.delete()

    // Send the new choice embed instructions
    const sentEmbed = await menu.message.channel.send(choice.embed)
    const filter = (message: Message) => message.member.id === authorId

    try {
      // Await for the user to send the value requested
      const collected = await sentEmbed.channel.awaitMessages(filter, {
        max: 1,
        time: this.FIVE_MINUTES
      })

      const message = collected.first()

      if (
        !message ||
        message?.content.length === 0 ||
        message?.mentions?.channels.size === 0
      ) {
        throw new Error('User did not send a value.')
      }

      const response = new MessageEmbed()
        .setTitle(`✅ ${choice.label} updated`)
        .setColor(6867286)

      if (value === 'enable_track') {
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

      if (value === 'enable_updates') {
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

      if (value === 'enable_replay') {
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

      // Send success message and resend the menu
      message.channel.send(response)
      await this.sendMenu(message)
    } catch {
      // User did not send a value
      const embed = new MessageEmbed()
        .setTitle(`❌ Timeout : ${choice.label}`)
        .setDescription(
          'You did not type a value. This operation has been canceled.'
        )
        .setColor(14504273)

      sentEmbed.delete()
      menu.message.channel.send(embed)
    }
  }

  /**
   * Sends the menu to the user
   */
  async sendMenu (message: Message): Promise<Message> {
    const { data: guild, error } = await supabase
      .from<GuildRow>('guilds')
      .select('*')
      .eq('guild_id', message.guild.id)
      .single()

    if (!error) {
      const {
        track_channel,
        updates_channel,
        replay_channel,
        admin_channel,
        prefix
      } = guild

      const embed = new MessageEmbed()
        .setTitle(`${message.guild.name}'s settings`)
        .addField(
          'Track Top Plays',
          `${track_channel ? '✅' : '❌'} ${
            track_channel ? `<#${track_channel}>` : 'No channel set.'
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

      await message.channel.send(embed)
    }

    const sentMessage = await message.channel.send(
      `What do you want to do ${message.member.displayName} ?`,
      this.select
    )

    const authorId = message.member.id

    const filter = (menu: MessageComponent) => menu.clicker.id === authorId
    // @ts-ignore
    const collector = sentMessage.createMenuCollector(filter, {
      time: this.FIVE_MINUTES
    })

    collector.once('collect', (menu: MessageComponent) =>
      this.handleMenuCollector(menu, authorId)
    )

    return message
  }

  async run (message: Message): Promise<Message> {
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        'You need to be an Administrator to use this command.'
      )
    }
    return this.sendMenu(message)
  }
}
