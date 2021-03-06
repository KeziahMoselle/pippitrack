import supabase from '../../libs/supabase'
import ordr from '../../libs/ordr'
import getTrackChannels from '../../utils/getTrackChannels'
import { Client } from 'discord.js'
import { TrackedUsersRow } from '../../types/db'

interface TempOrdrInterface {
  start: () => void
}

export default function listenForRenders (client: Client): TempOrdrInterface {
  console.log('Service started : ordr')

  ordr.on('render_done', async ({ renderID }) => {
    try {
      const render = await ordr.renders({ renderID })

      if (!render || !render.renders || render.renders.length === 0) {
        return console.log(`ID: ${renderID} | Render empty ${render}`)
      }

      const replay = render.renders[0]

      const { data: isUserTracked } = await supabase
        .from<TrackedUsersRow>('tracked_users')
        .select('guild_id')
        .eq('osu_username', replay.replayUsername)
        .eq('is_approved', true)
        .single()

      if (!isUserTracked) return

      try {
        const { replayChannel } = await getTrackChannels(
          isUserTracked.guild_id,
          client
        )

        if (!replayChannel) {
          return
        }

        console.log(
          `Sending new replay from ${replay.replayUsername} (id: ${replay.renderID})`
        )

        replayChannel.send(
          `New replay from **${replay.replayUsername}** !\n${replay.videoUrl}`
        )
      } catch (error) {
        console.error('ordr service error fetching channel :', error)
      }
    } catch (error) {
      console.error('ordr service error : ', error)
    }
  })

  return ordr
}
