import supabase from '../libs/supabase'
import { osuApiV2 } from '../libs/osu'
import { Message } from 'discord.js'
import { User } from '../types/osu'
import { UsersRow } from '../types/db'

interface GetUserArgs {
  message?: Message
  args?: string[]
  id?: string
  username?: string
  mode?: string
  discordId?: string
}

/**
 * Get osu! user data
 */
export default async function getUser ({
  id,
  username,
  mode,
  discordId
}: GetUserArgs): Promise<{
  user: User,
  mode: 'osu' | 'taiko' | 'fruits' | 'mania' | string
}> {
  if (username) {
    const user = await osuApiV2.getUser({ username, mode })

    return {
      user,
      mode: mode || user.playmode
    }
  }

  if (id) {
    const user = await osuApiV2.getUser({ id, mode })

    return {
      user,
      mode: mode || user.playmode
    }
  }

  if (discordId) {
    // If no argument is provided, try to get the osu_id from our database
    const { data: savedUsername } = await supabase
      .from<UsersRow>('users')
      .select('osu_id, mode')
      .eq('discord_id', discordId)
      .single()

    if (savedUsername) {
      const user = await osuApiV2.getUser({
        id: savedUsername.osu_id,
        mode: mode || savedUsername.mode
      })

      return {
        user,
        mode: mode || savedUsername.mode
      }
    }
  }
}
