import supabase from '../libs/supabase';

export default async function untrackUser(id) {
  return supabase
    .from('tracked_users')
    .delete()
    .eq('id', id)
    .single()
}
