const supabase = require('../libs/supabase')

function untrackUser(osu_id) {
  return supabase
    .from('tracked_users')
    .delete()
    .eq('osu_id', osu_id)
}

module.exports = untrackUser