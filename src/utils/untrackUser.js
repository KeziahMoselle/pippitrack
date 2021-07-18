const supabase = require('../libs/supabase')

async function untrackUser (id) {
  return supabase
    .from('tracked_users')
    .delete()
    .eq('id', id)
    .single()
}

module.exports = untrackUser
