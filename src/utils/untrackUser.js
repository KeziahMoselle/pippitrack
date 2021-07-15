const supabase = require('../libs/supabase')

function untrackUser (id) {
  return supabase
    .from('tracked_users')
    .delete()
    .eq('id', id)
}

module.exports = untrackUser
