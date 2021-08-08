import supabase from '../libs/supabase'
import { osu } from '../libs/osu'
import { Message } from 'discord.js'
import { User } from 'node-osu'

interface GetUserArgs {
  username?: string
  message?: Message
  args?: string[]
  id?: string
}

/**
 * Get osu! user data
 */
export default async function getUser ({
  username,
  message,
  args,
  id
}: GetUserArgs): Promise<User> {
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

  if (username) {
    // Allow username with whitespaces
    return osu.getUser({
      u: username,
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
