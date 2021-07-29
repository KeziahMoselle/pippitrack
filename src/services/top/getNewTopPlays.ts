import supabase from '../../libs/supabase'
import updatePlayerState from './updatePlayerState'
import { TrackedPlayer } from '../../types'
import { UsersStateRow } from '../../types/db'
import { Score } from '../../types/osu'
import { osuApiV2 } from '../../libs/osu'

export default async function getNewTopPlays (
  trackedPlayer: TrackedPlayer
): Promise<Score[]> {
  // Check if the user is already in the DB
  const { data: currentPlayerState, error } = await supabase
    .from<UsersStateRow>('users_state')
    .select('*')
    .eq('osu_id', trackedPlayer.osu_id)
    .maybeSingle()

  // If not create the initial state
  // This should already be the case but just in case
  // see : src/subscribers/trackedUsers.ts
  if (error || !currentPlayerState) {
    console.error('getNewTopPlays error :', error)
    updatePlayerState(trackedPlayer)
    return []
  }

  // Compare the new scores with the old ones
  try {
    console.time(`Compare ${trackedPlayer.osu_username} top plays`)

    const newTopPlays = []

    const newScores = await osuApiV2.getUserBestScores({
      id: trackedPlayer.osu_id
    })

    const lastUpdatedAt = new Date(currentPlayerState.last_updated)

    let personalBestIndex = 1
    for (const play of newScores) {
      const scoreDate = new Date(play.created_at)

      // If the score is more recent than the last update
      // add it to the newTopPlays array
      if (scoreDate >= lastUpdatedAt) {
        newTopPlays.push({ ...play, personalBestIndex })
      }

      personalBestIndex++
    }

    return newTopPlays
  } catch (error) {
    console.error('getNewTopPlays comparing error :', error)
  } finally {
    console.timeEnd(`Compare ${trackedPlayer.osu_username} top plays`)
  }
}
