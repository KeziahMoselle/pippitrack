import { CronJob } from 'cron'
import osuTrack from '../../libs/osutrack'
import getTrackedPlayers from '../../utils/getTrackedPlayers'
import wait from '../../utils/wait'
import {
  maxUsersUpdatedSimultaneously,
  maxRequestsBeforeSleep
} from '../../config'
import { Client, MessageEmbed } from 'discord.js'
import { TrackedPlayer } from '../../types'

const EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *'
const TEN_SECONDS = 10 * 1000

export default function update (client: Client): CronJob {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime: EVERY_DAY_AT_MIDNIGHT,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris'
  })

  async function massUpdatePlayers () {
    try {
      console.time('massUpdatePlayers')

      const { uniqueTrackedPlayers, count } = await getTrackedPlayers(
        client,
        'updates'
      )
      console.log(`Update service: ${count} players to update`)

      let batchNumber = 0
      let updatedPlayers = 0

      // Update all the players
      while (uniqueTrackedPlayers.length > 0) {
        if (updatedPlayers >= maxRequestsBeforeSleep) {
          // wait to avoid too many requests
          await wait(TEN_SECONDS)
          updatedPlayers = 0
        }

        const batchOfPlayers = uniqueTrackedPlayers.splice(
          0,
          maxUsersUpdatedSimultaneously
        )
        console.log(
          `batch n°${batchNumber}`,
          `${batchOfPlayers.length} players to update in this batch.`
        )

        const fetches = batchOfPlayers.map((player) => updatePlayer(player))

        // Batch updates of players
        let results = null
        try {
          results = await Promise.all(fetches)
        } catch (error) {
          console.error('massUpdatePlayers, Promise.all error', error)
        }

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

async function updatePlayer (player: TrackedPlayer) {
  const { status, embed } = await osuTrack.update(null, player.osu_id)

  return {
    player,
    embed,
    status
  }
}

async function sendEmbeds (
  updates: {
    player: TrackedPlayer
    embed: MessageEmbed
    status: 'first' | 'no_change' | 'update'
  }[]
) {
  for (const update of updates) {
    if (update.status === 'no_change') {
      console.log(`${update.player.osu_username} has no changes.`)
      continue
    }

    for (const channel of update.player.updatesChannels) {
      try {
        await channel.send(update.embed)
        console.info(`${update.player.osu_username} in #${channel.name}`)
      } catch (error) {
        console.error('sendEmbeds error:', error, update, channel)
      }
    }
  }
}
