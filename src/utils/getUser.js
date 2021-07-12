const { MessageFlags } = require('discord.js')
const supabase = require('../libs/supabase')
const { osu } = require('../libs/osu')


/**
 * Get osu! user data
 *
 * @param {Object} { message, args }
 * @return {*}
 */
async function getUser({ message, args }) {
  try {
    // Allow username with whitespaces
    let usernameArg = args
      .join(' ')
      .replace(/"/g, '')

    if (usernameArg) {
      return osu.getUser({
        u: usernameArg,
        type: 'string'
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
  } catch (error) {
    console.error(error)
    return
  }
}

module.exports = getUser