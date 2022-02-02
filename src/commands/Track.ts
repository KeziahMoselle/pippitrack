import { MessageEmbed, Message, TextChannel } from 'discord.js'
import { MessageButton } from 'discord-buttons'
import supabase from '../libs/supabase'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { defaultPrefix, maxTrackedUsersInGuild } from '../config'
import prefixes from '../libs/prefixes'
import { GuildRow } from '../types/db'
import { BaseDiscordCommand } from '../types'
import getOsuAvatar from '../utils/getOsuAvatar'

export default class TrackCommand implements BaseDiscordCommand {
  name = 'track'
  arguments = ['username']
  description =
    'Allows you to track top plays and replays. Also enable daily updates of your profile.'

  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message: Message, args: string[]): Promise<Message | Message[]> {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
    }

    try {
      const { count } = await supabase
        .from('tracked_users')
        .select('*', { count: 'exact' })
        .eq('guild_id', message.guild.id)

      if (count >= maxTrackedUsersInGuild) {
        const embed = new MessageEmbed()
          .setTitle(
            `You reached the limit of tracked users ! (${count}/${maxTrackedUsersInGuild})`
          )
          .setDescription(
            'You can untrack users by typing `!untrack <username>`\nYou can see a list of tracked users by typing `!tracklist <?page>`'
          )
        return message.channel.send(embed)
      }

      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('osu_id', user.id)
        .eq('guild_id', message.guild.id)
        .eq('is_approved', true)
        .single()

      // If we find a result there is already a player tracked.
      if (userFound) {
        const embed = new MessageEmbed()
          .setTitle('Player already tracked')
          .setDescription(`**${user.name}** is already being tracked.`)
          .setThumbnail(getOsuAvatar(user.id))

        const untrackBtn = new MessageButton()
          .setStyle('red')
          .setLabel('Untrack')
          .setID(`untrack_${userFound.id}`)

        return message.channel.send(embed, untrackBtn)
      }

      // Check if the guild has set an admin channel.
      const { data: guild } = await supabase
        .from<GuildRow>('guilds')
        .select('*')
        .eq('guild_id', message.guild.id)
        .single()

      if (!guild || !guild.track_channel) {
        const embed = new MessageEmbed()
          .setTitle('You need to set a tracking channel first')
          .setDescription(
            'Type `!set track` or `!set replay` in the channel of your choice then type `!track <?username>`.'
          )
        return message.channel.send(embed)
      }

      // If the user wants to be tracked and :
      // - The user is not an administrator
      // - The guild didn't set an admin channel
      // That means we need to show an error message to the user.
      if (
        !message.member.hasPermission('ADMINISTRATOR') &&
        !guild.admin_channel
      ) {
        const prefix = prefixes.get(message.guild.id) || defaultPrefix

        const embed = new MessageEmbed()
          .setDescription(
            'Sorry you need to be an administrator to use this command.\n' +
              `Members are allowed to send track requests if the administrators allow it. (\`${prefix}config\`)`
          )
          .setColor(14504273)

        return message.channel.send(embed)
      }

      const trackChannel = message.guild.channels.cache.get(guild.track_channel)
      const replayChannel = message.guild.channels.cache.get(
        guild.replay_channel
      )

      if (
        guild.admin_channel &&
        (trackChannel || replayChannel) &&
        !message.member.hasPermission('ADMINISTRATOR')
      ) {
        const adminChannel: TextChannel = message.guild.channels.cache.get(
          guild.admin_channel
        ) as TextChannel

        const { data: userPendingApproval } = await supabase
          .from('tracked_users')
          .select('is_approved')
          .eq('osu_id', user.id)
          .eq('guild_id', message.guild.id)
          .eq('is_approved', false)
          .single()

        if (userPendingApproval) {
          return message.reply(
            'You already have a pending approval for this server.'
          )
        }

        // Add the approval request to the database.
        const { data: approvalRequest } = await supabase
          .from('tracked_users')
          .upsert({
            id: userFound?.id,
            osu_id: user.id,
            osu_username: user.name,
            guild_id: message.guild.id,
            is_approved: false
          })
          .eq('guild_id', message.guild.id)
          .single()

        const embed = new MessageEmbed()
          .setTitle(`${user.name} requested to be tracked on this server.`)
          .setAuthor(
            message.member.nickname
              ? message.member.nickname
              : message.member.displayName,
            message.author.displayAvatarURL()
          )
          .setDescription(
            'If you want this player to be tracked.\nClick on the button below !'
          )
          .addField('Discord Tag', message.member, true)
          .addField('osu! profile', `https://osu.ppy.sh/users/${user.id}`, true)
          .addField('osu! rank', `#${user.pp.rank}`, true)
          .setThumbnail(getOsuAvatar(user.id))
          .setColor(11279474)

        const trackBtn = new MessageButton()
          .setStyle('green')
          .setLabel('Accept')
          .setID(
            `track_${approvalRequest.id}_${message.member.id}_${message.guild.id}`
          )

        await adminChannel.send(embed, trackBtn)

        message.reply(
          'Your request has been successfully sent to the administrators.'
        )

        return
      }

      // Track the user
      const { error } = await supabase
        .from('tracked_users')
        .upsert({
          id: userFound?.id,
          osu_id: user.id,
          osu_username: user.name,
          guild_id: message.guild.id,
          is_approved: true
        })
        .eq('guild_id', message.guild.id)

      if (error) {
        console.log(error)
        return message.reply('Sorry, there was an error.')
      }

      const embed = new MessageEmbed()
        .setTitle(`Now tracking : ${user.name}`)
        .setThumbnail(getOsuAvatar(user.id))
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      message.channel.send(embed)
    } catch (error) {
      console.error(error)
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${args.join(' ')}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}
