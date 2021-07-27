import supabase from '../../libs/supabase'
import { TrackedPlayer } from '../../types'

export default async function updatePlayerState (
  trackedPlayer: TrackedPlayer
): Promise<void> {
  const { error } = await supabase
    .from('users_state')
    .upsert({
      osu_id: trackedPlayer.osu_id,
      last_updated: new Date()
    })
    .eq('osu_id', trackedPlayer.osu_id)

  if (error) {
    console.error('updateTopPlays error when upserting :', error)
  }
}
