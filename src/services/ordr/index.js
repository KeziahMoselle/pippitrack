const supabase = require('../../libs/supabase')
const ordr = require('../../libs/ordr')
const { osu } = require('../../libs/osu')

function listenForRenders(client) {
  console.log('Service started : ordr')

  ordr.on('render_done', async (data) => {
    try {
      const render = await ordr.renders({ renderID: data.render_done })
      const replay = render.renders[0]


      const { data: isUserTracked } = await supabase
      .from('tracked_users')
      .select('*')
      .eq('osu_username', replay.replayUsername)
      .single()

      if (!isUserTracked) return

      const channel = (await client.guilds.fetch('826567787107057665')).channels.cache.get('864626246263767080')

      channel.send(`New replay from **${isUserTracked.osu_username}** !\n${replay.videoUrl}`)
    } catch (error) {
      console.error(error)
    }
  })

  return ordr
}

module.exports = listenForRenders