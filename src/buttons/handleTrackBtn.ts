/* eslint-disable @typescript-eslint/ban-ts-comment */
import { MessageButton, MessageComponent } from 'discord-buttons'
import { Client } from 'discord.js'
import supabase from '../libs/supabase'
import getTrackChannels from '../utils/getTrackChannels'

export default async function handleTrackBtn (
  button: MessageComponent,
  client: Client
): Promise<void> {
  const [, id, userDiscordId, guildId] = button.id.split('_')

  // @ts-ignore
  await button.reply.defer()

  const { error } = await supabase
    .from('tracked_users')
    .update({ is_approved: true })
    .eq('id', id)
    .single()

  if (error) {
    // @ts-ignore
    return button.reply.send('Sorry, there was an error.', true)
  }

  const approvedBtn = new MessageButton()
    .setStyle('blurple')
    .setLabel('Approved')
    .setID('track_approved')
    .setDisabled()

  button.message.edit(button.message.embeds[0], approvedBtn)

  const { trackChannel } = await getTrackChannels(guildId, client)
  trackChannel.send(`<@${userDiscordId}> is now tracked.`)
}
