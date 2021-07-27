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

  // Get track channels for top plays
  const trackChannel: TextChannel = discordGuild.channels.cache.get(
    guild.track_channel
  ) as TextChannel

  // Get updates channel for daily osu!track updates
  const updatesChannel: TextChannel = discordGuild.channels.cache.get(
    guild.updates_channel
  ) as TextChannel

  // Get replay channel for o!rdr replays
  const replayChannel: TextChannel = discordGuild.channels.cache.get(
    guild.replay_channel
  ) as TextChannel

  return {
    trackChannel,
    updatesChannel,
    replayChannel
  }
}

const getTrackChannelsMemoized = mem(getTrackChannels, {
  maxAge: TEN_MINUTES
})

export default getTrackChannelsMemoized
