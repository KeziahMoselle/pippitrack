import { Client } from 'discord.js'
import supabase from '../libs/supabase'
import getTrackChannels from './getTrackChannels'
import { GetTrackedPlayersData, DBUser, TrackedPlayers } from '../types'

type TrackType = 'track' | 'updates' | 'replay'

/**
 * Get all tracked players
 *
 * @param {*} client Discord.js client
 * @return {*}
 */
export default async function getTrackedPlayers (
  client: Client,
  type: TrackType,
  osuId?: string
): Promise<GetTrackedPlayersData> {
  // @TODO Paginate them if there is too much to fetch
  let trackedPlayers = null

  if (osuId) {
    const { data } = await supabase
      .from<DBUser>('tracked_users')
      .select('*')
      .eq('osu_id', osuId)
      .eq('is_approved', true)

    trackedPlayers = data
  } else {
    const { data } = await supabase
      .from<DBUser>('tracked_users')
      .select('*')
      .eq('is_approved', true)
    trackedPlayers = data
  }

  // Merge same osu_id in the same object so we don't iterate over them 2 times
  // It allows us to do only one request for the update, then send the embed to multiple channels if needed
  const uniqueTrackedPlayers: TrackedPlayers = {}

  for (const player of trackedPlayers) {
    // Add the player to the unique list
    if (!uniqueTrackedPlayers[player.osu_id]) {
      uniqueTrackedPlayers[player.osu_id] = {
        ...player,
        trackChannels: [],
        updatesChannels: [],
        replayChannels: []
      }
    }

    const { trackChannel, replayChannel, updatesChannel } =
      await getTrackChannels(player.guild_id, client)

    if (trackChannel) {
      uniqueTrackedPlayers[player.osu_id].trackChannels.push(trackChannel)
    }

    if (updatesChannel) {
      uniqueTrackedPlayers[player.osu_id].updatesChannels.push(updatesChannel)
    }

    if (replayChannel) {
      uniqueTrackedPlayers[player.osu_id].replayChannels.push(replayChannel)
    }
  }

  const filteredTrackedPlayers = Object.values(uniqueTrackedPlayers).filter(
    (player) => {
      if (type === 'track' && player.trackChannels.length > 0) {
        return true
      }

      if (type === 'updates' && player.updatesChannels.length > 0) {
        return true
      }

      if (type === 'replay' && player.replayChannels.length > 0) {
        return true
      }

      return false
    }
  )

  const count = Object.keys(uniqueTrackedPlayers).length

  return {
    uniqueTrackedPlayers: filteredTrackedPlayers,
    count
  }
}
