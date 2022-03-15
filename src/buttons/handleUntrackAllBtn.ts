/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MessageEmbed } from 'discord.js'
import { MessageButton, MessageComponent } from 'discord-buttons'
import supabase from '../libs/supabase'

export default async function handleUntrackAllBtn (
  button: MessageComponent
): Promise<void> {
  const [, guildId, id] = button.id.split('_')

  // Check if the author has the permission to untrack the user
  if (!button.clicker.member.permissions.has('ADMINISTRATOR')) {
    button.reply.send(
      'You need to be an Administrator to untrack all players.',
      // @ts-ignore
      true
    )
    return
  }

  // Check if the author is the same as the untrack request
  if (button.clicker.id !== id) {
    button.reply.send(
      'Sorry but only the author of the message can complete this action.',
      // @ts-ignore
      true
    )
    return
  }

  // @ts-ignore
  await button.reply.defer()

  const { data: untrackedUsers, error } = await supabase
    .from('tracked_users')
    .delete()
    .eq('guild_id', guildId)

  if (error) {
    console.error('handleUntrackBtn error :', error)
    // @ts-ignore
    return button.reply.send('Sorry, there was an error.', true)
  }

  const embed = new MessageEmbed()
    .setTitle(
      `Successfully untracked ${untrackedUsers.length} player${
        untrackedUsers.length > 1 ? 's' : ''
      }.`
    )
    .setColor(6867286)

  const disabledUntrackBtn = new MessageButton()
    .setStyle('grey')
    .setLabel('Untracked sucessfully')
    .setID('untrackall_disabled')
    .setDisabled()

  await button.message.edit(embed, disabledUntrackBtn)
}
