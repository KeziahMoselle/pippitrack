import { CronJob } from 'cron'
import { getUpdate } from '../../api'
import getTrackedPlayers from '../../utils/getTrackedPlayers'

const EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *'

export default function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime: EVERY_DAY_AT_MIDNIGHT,
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

          if (!player.trackChannels) {
            console.log(
              `No track channel found: ${player.osu_username} (${player.osu_id})`
            )

            continue
          }

          for (const channel of player.trackChannels) {
            channel.send(embed)
            console.info(
              `${player.osu_username} in #${channel.name} (${i}/${count})`
            )
          }
        } catch (error) {
          console.error('update', player)
          console.error(error)
        }
      }
    } catch (error) {
      console.error('massUpdatePlayers error :', error)
    } finally {
      console.timeEnd('massUpdatePlayers')
    }
  }

  return job
}
