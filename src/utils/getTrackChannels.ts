import supabase from '../libs/supabase'

/**
 * Get configured channels from a guild
 *
 * @param {string} guildId
 */
export default async function getTrackChannels (guildId, client) {
  const { data: guild, error } = await supabase
    .from('guilds')
    .select('*')
    .eq('guild_id', guildId)
    .single()

  if (error) {
    console.error(error)
    return {}
  }

  const discordGuild = await client.guilds.fetch(guildId)
  const trackChannel = discordGuild.channels.cache.get(guild.track_channel)
  const replayChannel = discordGuild.channels.cache.get(guild.replay_channel)

  return {
    trackChannel,
    replayChannel
  }
}
