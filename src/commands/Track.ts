import { MessageEmbed, TextChannel, CommandInteraction, GuildMember } from 'discord.js'
import supabase from '../libs/supabase'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { maxTrackedUsersInGuild } from '../config'
import { GuildRow } from '../types/db'
import { BaseDiscordCommand } from '../types'
import { SlashCommandBuilder } from '@discordjs/builders'
import getEmoji from '../utils/getEmoji'
import updatePlayerState from '../services/top/updatePlayerState'

export default class TrackCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('track')
    .setDescription('Allows you to track top plays and replays. Also enable weekly updates of your profile.')
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

    const { user, error } = await getUser({
      username,
      discordId: interaction.user.id,
      mode
    })

    if (error) {
      const embed = new MessageEmbed()
        .setDescription(`Couldn't find \`${username}\`.\nTry with a different username or re link your account with \`/link\`.`)
        .setColor(14504273)

      interaction.editReply({ embeds: [embed] })
      return
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
            'You can untrack users by typing `/untrack <username>`\nYou can see a list of tracked users by typing `/tracklist <?page>`'
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

      // Check if the guild has set an admin channel.
      const { data: guild } = await supabase
        .from<GuildRow>('guilds')
        .select('*')
        .eq('guild_id', interaction.guild.id)
        .single()

      if (!guild) {
        const embed = new MessageEmbed()
          .setTitle('You need to set a tracking channel first')
          .setDescription(
            'Type /configure and setup a track channel then retry. (either top or updates)'
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
        const embed = new MessageEmbed()
          .setDescription(
            'Sorry you need to be an administrator to use this command.'
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
            osu_username: user.username,
            guild_id: interaction.guild.id,
            is_approved: false
          })
          .eq('guild_id', interaction.guild.id)
          .single()

        const embed = new MessageEmbed()
          .setTitle(`${user.username} requested to be tracked on this server.`)
          .setAuthor({
            name: member.nickname
              ? member.nickname
              : member.displayName,
            iconURL: member.displayAvatarURL()
          }
          )
          .setDescription(
            'If you want this player to be tracked.\nClick on the button below !'
          )
          .addField('Discord Tag', member.toString(), true)
          .addField('osu! profile', `https://osu.ppy.sh/users/${user.id}`, true)
          .addField('osu! rank', `#${user.statistics.global_rank}`, true)
          .setThumbnail(user.avatar_url)
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
          osu_username: user.username,
          osu_mode: mode,
          guild_id: interaction.guild.id,
          is_approved: true
        })
        .eq('guild_id', interaction.guild.id)

      if (error) {
        console.log(error)
        return interaction.reply('Sorry, there was an error.')
      }

      updatePlayerState({
        osu_id: `${user.id}`
      })

      const embed = new MessageEmbed()
        .setTitle(`Now tracking : ${user.username}`)
        .setThumbnail(user.avatar_url)
        .addField('Rank', `#${user.statistics.global_rank}`, true)
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
