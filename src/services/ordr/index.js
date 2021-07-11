const client = require('../../libs/client')
const supabase = require('../../libs/supabase')
const ordr = require('../../libs/ordr')
const getReplayData = require('./getReplayData')

function listenForRenders() {
  console.log('Service started : ordr')

  ordr.on('render_done', async (data) => {
    try {
      const replay = await getReplayData(data.render_done)
      const channel = (await client.guilds.fetch('826567787107057665')).channels.cache.get('862370264313233439')

      const { data: isUserTracked } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('osu_id', replay.user.id)
        .single()

      if (!isUserTracked) return

      channel.send(`New replay from **${replay.user.name}** !\n${replay.replay.videoUrl}`)
    } catch (error) {
      console.error(error)
    }
  })

  return ordr
}

module.exports = listenForRenders