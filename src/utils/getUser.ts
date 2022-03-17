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
  message,
  args,
  id,
  username,
  mode = 'osu'
}: GetUserArgs): Promise<User> {
  if (username) {
    return osu.getUser({
      u: username,
      type: 'string',
      m: getModeInt(mode)
    })
  }

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
    const usernameArg = args.join(' ').replace(/"/g, '')

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

  if (!message.member) {
    return
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
