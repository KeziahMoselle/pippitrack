import { CronJob } from 'cron'
import { getUpdate } from '../../api'
import getTrackedPlayers from '../../utils/getTrackedPlayers'
import wait from '../../utils/wait'
import {
  maxUsersUpdatedSimultaneously,
  maxRequestsBeforeSleep
} from '../../config'

const EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *'
const TEN_SECONDS = 10 * 1000

export default function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime: EVERY_DAY_AT_MIDNIGHT,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris',
    runOnInit: true
  })

  async function massUpdatePlayers () {
    try {
      console.time('massUpdatePlayers')

      const { uniqueTrackedPlayers, count } = await getTrackedPlayers(client)
      console.log(`Update service: ${count} players to update`)

      const trackedPlayers = Object.values(uniqueTrackedPlayers)

      let batchNumber = 0
      let updatedPlayers = 0

      // Update all the players
      while (trackedPlayers.length > 0) {
        if (updatedPlayers >= maxRequestsBeforeSleep) {
          // wait to avoid too many requests
          await wait(TEN_SECONDS)
          updatedPlayers = 0
        }

        const batchOfPlayers = trackedPlayers.splice(
          0,
          maxUsersUpdatedSimultaneously
        )
        console.log(
          `batch n°${batchNumber}`,
          `${batchOfPlayers.length} players to update in this batch.`
        )

        const fetches = batchOfPlayers.map((player) => updatePlayer(player))

        // Batch updates of players
        const results = await Promise.all(fetches)

        // Send embeds without waiting for the response
        sendEmbeds(results)

        batchNumber++
        updatedPlayers += batchOfPlayers.length
      }

      console.log(
        `Update service: Total batch ${batchNumber} (${maxUsersUpdatedSimultaneously} users per batch) => ${
          batchNumber * maxUsersUpdatedSimultaneously
        } players updated`
      )
    } catch (error) {
      console.error('massUpdatePlayers error :', error)
    } finally {
      console.timeEnd('massUpdatePlayers')
    }
  }

  return job
}

async function updatePlayer (player) {
  const { status, embed } = await getUpdate(null, player.osu_id)

  return {
    player,
    embed,
    status
  }
}

function sendEmbeds (updates) {
  for (const update of updates) {
    if (update.status === 'no_change') {
      continue
    }

    for (const channel of update.player.trackChannels) {
      channel.send(update.embed)
      console.info(`${update.player.osu_username} in #${channel.name}`)
    }
  }
}
