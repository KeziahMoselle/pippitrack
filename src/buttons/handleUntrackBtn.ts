/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MessageEmbed } from 'discord.js'
import { MessageButton, MessageComponent } from 'discord-buttons'
import untrackUser from '../utils/untrackUser'

export default async function handleUntrackBtn (
  button: MessageComponent
): Promise<void> {
  const [, id] = button.id.split('_')

  // Check if the author has the permission to untrack the user
  if (!button.clicker.member.hasPermission('ADMINISTRATOR')) {
    button.reply.send(
      'You need to be an Administrator to untrack players.',
      // @ts-ignore
      true
    )

    return
  }

  // @ts-ignore
  await button.reply.defer()

  const { data: untrackedUser, error } = await untrackUser(id)

  if (error) {
    // @ts-ignore
    return await button.reply.send('Sorry, there was an error.', true)
  }

  const embed = new MessageEmbed().setTitle(
    `${untrackedUser.osu_username} has been untracked`
  )

  const untrackBtn = new MessageButton()
    .setStyle('grey')
    .setLabel('Untracked')
    .setID('untrack_disabled')
    .setDisabled()

  await button.message.edit(embed, untrackBtn)
}
