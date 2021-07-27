import {
  RealtimeSubscription,
  SupabaseRealtimePayload
} from '@supabase/supabase-js'
import supabase from '../libs/supabase'
import updatePlayerState from '../services/top/updatePlayerState'
import { TrackedUsersRow } from '../types/db'

export default async function listenForTrackedUsers (): Promise<RealtimeSubscription> {
  const subscription = await supabase
    .from<TrackedUsersRow>('tracked_users')
    .on('*', onInsertedTrackedUser)
    .subscribe()

  return subscription
}

/**
 * On insert or update in the `tracked_users` table
 * Initialize a new player for the `users_state` table
 * by setting its its initial state for top plays tracking.
 */
async function onInsertedTrackedUser (
  payload: SupabaseRealtimePayload<TrackedUsersRow>
) {
  if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
    if (!payload.new.is_approved) {
      return
    }

    // Only init approved users
    try {
      const { data: hasState, error } = await supabase
        .from('users_state')
        .select('*')
        .eq('osu_id', payload.new.osu_id)
        .maybeSingle()

      if (error) {
        return console.error('listenForTrackedusers users_state error :', error)
      }

      if (hasState) {
        return
      }

      await updatePlayerState(payload.new)
    } catch (error) {
      console.error('onInsertedTrackedUser error :', error)
    }
  }
}
