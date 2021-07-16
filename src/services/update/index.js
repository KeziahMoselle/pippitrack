const { CronJob } = require('cron')
const { getUpdate } = require('../../api')
const getTrackedPlayers = require('../../utils/getTrackedPlayers')

const EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *'

const cronTime = EVERY_DAY_AT_MIDNIGHT

function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris'
  })

  async function massUpdatePlayers () {
    try {
      const { uniqueTrackedPlayers, count } = await getTrackedPlayers(client)
      console.log(`Update service: ${count} players to update`)

      // Update all the players
      for (const id in uniqueTrackedPlayers) {
        const player = uniqueTrackedPlayers[id]

        try {
          const embed = await getUpdate(null, player.osu_id)

          for (const channel of player.trackChannels) {
            channel.send(embed)
          }
        } catch (error) {
          console.error('update', player)
          console.error(error)
        }
      }
    } catch (error) {
      console.error('update')
      console.error(error)
    }
  }

  return job
}

module.exports = update
