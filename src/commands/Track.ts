import { MessageEmbed, TextChannel, CommandInteraction, GuildMember } from 'discord.js'
import supabase from '../libs/supabase'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { defaultPrefix, maxTrackedUsersInGuild } from '../config'
import prefixes from '../libs/prefixes'
import { GuildRow } from '../types/db'
import { BaseDiscordCommand } from '../types'
import getOsuAvatar from '../utils/getOsuAvatar'
import { SlashCommandBuilder } from '@discordjs/builders'
import getEmoji from '../utils/getEmoji'

export default class TrackCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('track')
    .setDescription('Allows you to track top plays and replays. Also enable daily updates of your profile.')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('mode')
        .setDescription('Game mode')
        .addChoice('Standard', 'osu')
        .addChoice('Catch The Beat', 'fruits')
        .addChoice('Taiko', 'taiko')
        .addChoice('Mania', 'mania')
        .setRequired(true)
    )

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')
    const mode = interaction.options.getString('mode') || 'osu'

    const user = await getUser({
      username,
      discordId: interaction.user.id,
      mode
    })

    if (!user) {
      return interaction.reply({ embeds: [notFoundEmbed] })
    }

    const member = interaction.member as GuildMember

    try {
      const { count } = await supabase
        .from('tracked_users')
        .select('*', { count: 'exact' })
        .eq('guild_id', interaction.guild.id)

      if (count >= maxTrackedUsersInGuild) {
        const embed = new MessageEmbed()
          .setTitle(
            `You reached the limit of tracked users ! (${count}/${maxTrackedUsersInGuild})`
          )
          .setDescription(
            'You can untrack users by typing `!untrack <username>`\nYou can see a list of tracked users by typing `!tracklist <?page>`'
          )
        return interaction.reply({ embeds: [embed] })
      }

      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('osu_id', user.id)
        .eq('guild_id', interaction.guild.id)
        .eq('is_approved', true)
        .single()

      // If we find a result there is already a player tracked.
      if (userFound) {
        const embed = new MessageEmbed()
          .setTitle('Player already tracked')
          .setDescription(`**${user.name}** is already being tracked.`)
          .setThumbnail(getOsuAvatar(user.id))

        return interaction.reply({ embeds: [embed] })
      }

      // Check if the guild has set an admin channel.
      const { data: guild } = await supabase
        .from<GuildRow>('guilds')
        .select('*')
        .eq('guild_id', interaction.guild.id)
        .single()

      if (!guild || !guild.track_channel) {
        const embed = new MessageEmbed()
          .setTitle('You need to set a tracking channel first')
          .setDescription(
            'Type /configure and setup the track channel then retry.'
          )
        return interaction.reply({ embeds: [embed] })
      }

      // If the user wants to be tracked and :
      // - The user is not an administrator
      // - The guild didn't set an admin channel
      // That means we need to show an error message to the user.
      if (
        !member.permissions.has('ADMINISTRATOR') &&
        !guild.admin_channel
      ) {
        const prefix = prefixes.get(interaction.guild.id) || defaultPrefix

        const embed = new MessageEmbed()
          .setDescription(
            'Sorry you need to be an administrator to use this command.\n' +
              `Members are allowed to send track requests if the administrators allow it. (\`${prefix}config\`)`
          )
          .setColor(14504273)

        return interaction.reply({ embeds: [embed] })
      }

      const trackChannel = interaction.guild.channels.cache.get(guild.track_channel)
      const replayChannel = interaction.guild.channels.cache.get(
        guild.replay_channel
      )

      if (
        guild.admin_channel &&
        (trackChannel || replayChannel) &&
        !member.permissions.has('ADMINISTRATOR')
      ) {
        const adminChannel: TextChannel = interaction.guild.channels.cache.get(
          guild.admin_channel
        ) as TextChannel

        const { data: userPendingApproval } = await supabase
          .from('tracked_users')
          .select('is_approved')
          .eq('osu_id', user.id)
          .eq('guild_id', interaction.guild.id)
          .eq('is_approved', false)
          .single()

        if (userPendingApproval) {
          return interaction.reply(
            'You already have a pending approval for this server.'
          )
        }

        // Add the approval request to the database.
        await supabase
          .from('tracked_users')
          .upsert({
            id: userFound?.id,
            osu_id: user.id,
            osu_username: user.name,
            guild_id: interaction.guild.id,
            is_approved: false
          })
          .eq('guild_id', interaction.guild.id)
          .single()

        const embed = new MessageEmbed()
          .setTitle(`${user.name} requested to be tracked on this server.`)
          .setAuthor(
            member.nickname
              ? member.nickname
              : member.displayName,
            member.displayAvatarURL()
          )
          .setDescription(
            'If you want this player to be tracked.\nClick on the button below !'
          )
          .addField('Discord Tag', member.toString(), true)
          .addField('osu! profile', `https://osu.ppy.sh/users/${user.id}`, true)
          .addField('osu! rank', `#${user.pp.rank}`, true)
          .setThumbnail(getOsuAvatar(user.id))
          .setColor(11279474)

        await adminChannel.send({ embeds: [embed] })

        interaction.reply(
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
          guild_id: interaction.guild.id,
          is_approved: true
        })
        .eq('guild_id', interaction.guild.id)

      if (error) {
        console.log(error)
        return interaction.reply('Sorry, there was an error.')
      }

      const embed = new MessageEmbed()
        .setTitle(`Now tracking : ${user.name}`)
        .setThumbnail(getOsuAvatar(user.id))
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', `${getEmoji(mode)} ${mode}`, true)
        .setColor(11279474)

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
