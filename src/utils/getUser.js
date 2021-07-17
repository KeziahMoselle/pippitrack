const supabase = require('../libs/supabase')
const { osu } = require('../libs/osu')

/**
 * Get osu! user data
 *
 * @param {Object} { message, args }
 * @return {*}
 */
async function getUser ({ message, args, id }) {
  if (message?.mentions?.users?.size > 0) {
    const id = message.mentions.users.first().id
    const { data: dbUser } = await supabase
      .from('users')
      .select('osu_id')
      .eq('discord_id', id)
      .single()

    if (!dbUser) {
      return
    }

    return osu.getUser({
      u: dbUser.osu_id,
      type: 'id'
    })
  }

  if (args?.length > 0) {
    // Allow username with whitespaces
    const usernameArg = args
      .join(' ')
      .replace(/"/g, '')

    return osu.getUser({
      u: usernameArg,
      type: 'string'
    })
  }

  if (id) {
    return osu.getUser({
      u: id,
      type: 'id'
    })
  }

  // If no argument is provided, try to get the osu_id from our database
  const { data: savedUsername } = await supabase
    .from('users')
    .select('osu_id')
    .eq('discord_id', message.member.id)
    .single()

  if (savedUsername) {
    return osu.getUser({
      u: savedUsername.osu_id,
      type: 'id'
    })
  }

  // Else use the displayName of Discord
  if (!savedUsername) {
    return osu.getUser({
      u: message.member.displayName,
      type: 'string'
    })
  }
}

module.exports = getUser
