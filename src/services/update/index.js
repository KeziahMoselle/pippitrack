const { CronJob } = require('cron')
const supabase = require('../../libs/supabase')
// const { getUpdate } = require('../../api')
// const wait = require('../../utils/wait')
const getTrackChannel = require('../../utils/getTrackChannel')

// Test cron time : '*/30 * * * * *' (every 30 seconds)
const cronTime = '*/30 * * * * *' // Every day at midnight

function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris'
  })

  async function massUpdatePlayers () {
    try {
      // Get all tracked players
      // @TODO Paginate them if there is too much to fetch
      const { data: trackedPlayers, count } = await supabase
        .from('tracked_users')
        .select('*', { count: 'exact' })

      console.log(`Update service: ${count} players to update`)

      for (const player of trackedPlayers) {
        const channel = await getTrackChannel(player.guild_id, client)
        console.log(channel)
      }

      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  return job
}

module.exports = update
