import { CronJob } from 'cron'
import { getUpdate } from '../../api'
import getTrackedPlayers from '../../utils/getTrackedPlayers'

const EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *'

const cronTime = EVERY_DAY_AT_MIDNIGHT

export default function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris'
  })

  async function massUpdatePlayers () {
    try {
      console.time('massUpdatePlayers')
      const { uniqueTrackedPlayers, count } = await getTrackedPlayers(client)

      let i = 0
      console.log(`Update service: ${count} players to update`)

      // Update all the players
      for (const id in uniqueTrackedPlayers) {
        i++
        const player = uniqueTrackedPlayers[id]

        try {
          const embed = await getUpdate(null, player.osu_id)

          for (const channel of player.trackChannels) {
            channel.send(embed)
            console.info(`${player.osu_username} in #${channel.name} (${i}/${count})`)
          }
        } catch (error) {
          console.error('update', player)
          console.error(error)
        }
      }
    } catch (error) {
      console.error('update')
      console.error(error)
    } finally {
      console.timeEnd('massUpdatePlayers')
    }
  }

  return job
}
