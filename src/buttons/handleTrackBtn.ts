import { MessageButton } from 'discord-buttons'
import supabase from '../libs/supabase'
import getTrackChannels from '../utils/getTrackChannels'

export default async function handleTrackBtn (button, client) {
  const [, id, userDiscordId, guildId] = button.id.split('_')

  await button.reply.defer()

  const { error } = await supabase
    .from('tracked_users')
    .update({ is_approved: true })
    .eq('id', id)
    .single()

  if (error) {
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
