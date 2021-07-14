const supabase = require('../libs/supabase')

function untrackUser (osuId) {
  return supabase
    .from('tracked_users')
    .delete()
    .eq('osu_id', osuId)
}

module.exports = untrackUser
