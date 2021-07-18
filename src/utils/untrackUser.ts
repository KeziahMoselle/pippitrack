import supabase from '../libs/supabase'

export default async function untrackUser (id) {
  return await supabase
    .from('tracked_users')
    .delete()
    .eq('id', id)
    .single()
}
