const supabase = require('../../libs/supabase')
const ordr = require('../../libs/ordr')
const getTrackChannels = require('../../utils/getTrackChannels')

function listenForRenders (client) {
  console.log('Service started : ordr')

  ordr.on('render_done', async (data) => {
    try {
      const render = await ordr.renders({ renderID: data.render_done })
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

        replayChannel.send(`New replay from **${replay.replayUsername}** !\n${replay.videoUrl}`)
      }
    } catch (error) {
      console.error(error)
    }
  })

  return ordr
}

module.exports = listenForRenders
