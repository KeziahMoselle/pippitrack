import supabase from '../../libs/supabase'
import ordr from '../../libs/ordr'
import getTrackChannels from '../../utils/getTrackChannels'

export default function listenForRenders (client) {
  console.log('Service started : ordr')

  ordr.on('render_done', async (data) => {
    try {
      const render = await ordr.renders({ renderID: data.render_done })

      if (!render && render.renders.length === 0) {
        return console.log(`ID: ${data.render_done} | Render empty ${render}`)
      }

      const replay = render.renders[0]

      const { data: isUserTracked } = await supabase
        .from('tracked_users')
        .select('guild_id')
        .eq('osu_username', replay.replayUsername)
        .eq('is_approved', true)

      if (isUserTracked.length === 0) return

      for (const user of isUserTracked) {
        const { replayChannel } = await getTrackChannels(user.guild_id, client)

        if (!replayChannel) {
          return
        }

        replayChannel.send(
          `New replay from **${replay.replayUsername}** !\n${replay.videoUrl}`
        )
      }
    } catch (error) {
      console.error('ordr service error : ', error)
    }
  })

  return ordr
}
