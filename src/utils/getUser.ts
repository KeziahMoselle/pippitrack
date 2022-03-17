import supabase from '../libs/supabase'
import { osu } from '../libs/osu'
import { Message } from 'discord.js'
import { User } from 'node-osu'

interface GetUserArgs {
  message?: Message
  args?: string[]
  id?: string
  username?: string
  mode?: string
  discordId?: string
}

function getModeInt (mode: string) {
  const modes = {
    osu: 0,
    taiko: 1,
    ctb: 2,
    mania: 3
  }

  return modes[mode]
}

/**
 * Get osu! user data
 */
export default async function getUser ({
  id,
  username,
  mode = 'osu',
  discordId
}: GetUserArgs): Promise<User> {
  if (username) {
    return osu.getUser({
      u: username,
      type: 'string',
      m: getModeInt(mode)
    })
  }

  if (id) {
    return osu.getUser({
      u: id,
      type: 'id',
      m: getModeInt(mode)
    })
  }

  if (discordId) {
    // If no argument is provided, try to get the osu_id from our database
    const { data: savedUsername } = await supabase
      .from('users')
      .select('osu_id')
      .eq('discord_id', discordId)
      .single()

    if (savedUsername) {
      return osu.getUser({
        u: savedUsername.osu_id,
        type: 'id',
        m: getModeInt(mode)
      })
    }
  }
}
