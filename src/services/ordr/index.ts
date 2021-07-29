import supabase from '../../libs/supabase'
import ordr from '../../libs/ordr'
import getTrackChannels from '../../utils/getTrackChannels'
import { Client } from 'discord.js'

interface TempOrdrInterface {
  start: () => void
}

export default function listenForRenders (client: Client): TempOrdrInterface {
  console.log('Service started : ordr')

  ordr.on('render_done', async ({ renderID }) => {
    try {
      const render = await ordr.renders({ renderID })

      if (!render && render.renders.length === 0) {
        return console.log(`ID: ${renderID} | Render empty ${render}`)
      }

      const replay = render.renders[0]

      const { data: isUserTracked } = await supabase
        .from('tracked_users')
        .select('guild_id')
        .eq('osu_username', replay.replayUsername)
        .eq('is_approved', true)

      if (isUserTracked.length === 0) return

      for (const user of isUserTracked) {
        try {
          const { replayChannel } = await getTrackChannels(
            user.guild_id,
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
      }
    } catch (error) {
      console.error('ordr service error : ', error)
    }
  })

  return ordr
}
