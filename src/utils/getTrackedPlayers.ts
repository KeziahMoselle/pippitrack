/* eslint-disable camelcase */
import { Client } from 'discord.js'
import supabase from '../libs/supabase'
import getTrackChannels from './getTrackChannels'

/**
 * Get all tracked players
 *
 * @param {*} client Discord.js client
 * @return {*}
 */
export default async function getTrackedPlayers (client: Client) {
  // @TODO Paginate them if there is too much to fetch
  const { data: trackedPlayers } = await supabase
    .from('tracked_users')
    .select('*')
    .eq('is_approved', true)

  // Merge same osu_id in the same object so we don't iterate over them 2 times
  // It allows us to do only one request for the update, then send the embed to multiple channels if needed
  const uniqueTrackedPlayers = {}

  console.time('getTrackedPlayers')
  for (const player of trackedPlayers) {
    // Add the player to the unique list
    if (!uniqueTrackedPlayers[player.osu_id]) {
      uniqueTrackedPlayers[player.osu_id] = {
        id: player.id,
        osu_id: player.osu_id,
        osu_username: player.osu_username
      }

      // Create the channels array, so we can add multiple guilds to one player
      try {
        const { trackChannel, replayChannel } = await getTrackChannels(
          player.guild_id,
          client
        )
        uniqueTrackedPlayers[player.osu_id].trackChannels = [trackChannel]
        uniqueTrackedPlayers[player.osu_id].replayChannels = [replayChannel]
      } catch (error) {
        console.error('getTrackedPlayers', error)
      }
    } else {
      // We found a duplicate of the player, add the other guild to the array
      try {
        const { trackChannel, replayChannel } = await getTrackChannels(
          player.guild_id,
          client
        )
        uniqueTrackedPlayers[player.osu_id].trackChannels = [trackChannel]
        uniqueTrackedPlayers[player.osu_id].replayChannels = [replayChannel]
      } catch (error) {
        console.error('getTrackedPlayers', error)
      }
    }
  }
  console.timeEnd('getTrackedPlayers')

  const count = Object.keys(uniqueTrackedPlayers).length

  return {
    uniqueTrackedPlayers,
    count
  }
}
