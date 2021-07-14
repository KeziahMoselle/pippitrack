const { CronJob } = require('cron')
const supabase = require('../../libs/supabase')
const { getUpdate } = require('../../api')

// Test cron time : '*/30 * * * * *' (every 30 seconds)
const cronTime = '0 0 0 * * *' // Every day at midnight

function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris'
  })

  async function massUpdatePlayers () {
    const channel = (await client.guilds.fetch('826567787107057665')).channels.cache.get('828737685421293578')

    try {
      // Get all tracked players
      // @TODO Paginate them if there is too much to fetch
      const { data: trackedPlayers, count } = await supabase
        .from('tracked_users')
        .select('*', { count: 'exact' })

      console.log(`Update service: ${count} players to update`)

      const updatesPlayersBy5 = trackedPlayers.map(player => getUpdate(null, player.osu_id))
      const embeds = await Promise.all(updatesPlayersBy5)

      console.log(embeds)

      for (const embed of embeds) {
        await channel.send(embed)
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
