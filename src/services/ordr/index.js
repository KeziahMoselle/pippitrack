const supabase = require('../../libs/supabase')
const ordr = require('../../libs/ordr')
const { osu } = require('../../libs/osu')

function listenForRenders(client) {
  console.log('Service started : ordr')

  ordr.on('render_done', async (data) => {
    try {
      const render = await ordr.renders({ renderID: data.render_done })
      const replay = render.renders[0]

      console.log('replay')
      console.table(replay)

      const user = await osu.getUser({
        u: replay.replayUsername
      })

      console.log('user')
      console.table(user)


      const { data: isUserTracked } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('osu_id', user.id)
        .single()

      console.log('isUserTracked')
      console.table(isUserTracked)

      if (!isUserTracked) return

      const channel = (await client.guilds.fetch('826567787107057665')).channels.cache.get('862370264313233439')

      channel.send(`New replay from **${user.name}** !\n${replay.videoUrl}`)
    } catch (error) {
      console.error(error)
    }
  })

  return ordr
}

module.exports = listenForRenders