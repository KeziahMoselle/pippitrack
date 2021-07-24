import { Client, TextChannel } from 'discord.js'
import mem from 'p-memoize'
import supabase from '../libs/supabase'

const TEN_MINUTES = 10 * 60 * 1000

/**
 * Get configured channels from a guild
 *
 * @param {string} guildId
 */
async function getTrackChannels (guildId: string, client: Client) {
  const { data: guild, error } = await supabase
    .from('guilds')
    .select('*')
    .eq('guild_id', guildId)
    .single()

  if (error) {
    console.error('getTrackChannels', error)
    return {}
  }

  let discordGuild = client.guilds.cache.get(guildId)

  if (!discordGuild) {
    discordGuild = await client.guilds.fetch(guildId)
  }

  const trackChannel: TextChannel = discordGuild.channels.cache.get(
    guild.track_channel
  ) as TextChannel
  const replayChannel: TextChannel = discordGuild.channels.cache.get(
    guild.replay_channel
  ) as TextChannel

  return {
    trackChannel,
    replayChannel
  }
}

const getTrackChannelsMemoized = mem(getTrackChannels, {
  maxAge: TEN_MINUTES
})

export default getTrackChannelsMemoized
