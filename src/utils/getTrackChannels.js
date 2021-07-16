const supabase = require('../libs/supabase.js')

/**
 * Get configured channels from a guild
 *
 * @param {string} guildId
 */
async function getTrackChannels (guildId, client) {
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

module.exports = getTrackChannels
