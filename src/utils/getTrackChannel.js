const supabase = require('../libs/supabase.js')

/**
 * Get configured channels from a guild
 *
 * @param {string} guildId
 */
async function getTrackChannel (guildId, client) {
  const { data: guild, error } = await supabase
    .from('guilds')
    .select('*')
    .eq('guild_id', guildId)
    .single()

  if (error) {
    console.error(error)
    return
  }

  return (await client.guilds.fetch(guildId)).channels.cache.get(guild.track_channel)
}

module.exports = getTrackChannel
