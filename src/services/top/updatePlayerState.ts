import supabase from '../../libs/supabase'
import { TrackedPlayer } from '../../types'
import { UsersStateRow } from '../../types/db'

export default async function updatePlayerState (
  trackedPlayer: TrackedPlayer
): Promise<void> {
  if (!trackedPlayer.osu_id) {
    return console.error(
      'updatePlayerState error, trackedPlayer object does not contain osu_id',
      trackedPlayer
    )
  }

  const { error } = await supabase
    .from<UsersStateRow>('users_state')
    .upsert({
      osu_id: trackedPlayer.osu_id,
      last_updated: new Date()
    })
    .eq('osu_id', trackedPlayer.osu_id)

  if (error) {
    console.error('updatePlayerState error when upserting :', error)
  }
}
