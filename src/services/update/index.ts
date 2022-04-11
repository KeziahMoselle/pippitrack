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
const THIRTY_SECONDS = 30 * 1000

export default function update (client: Client): CronJob {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime: EVERY_DAY_AT_MIDNIGHT,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris',
    runOnInit: process.env.NODE_ENV === 'development'
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

      const updates: Update[] = []
      const errored: Update[] = []

      // Update all the players
      while (uniqueTrackedPlayers.length > 0) {
        if (updatedPlayers >= maxRequestsBeforeSleep) {
          // wait to avoid too many requests
          await wait(THIRTY_SECONDS)
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
          results = await Promise.allSettled(fetches)
        } catch (error) {
          console.error('massUpdatePlayers, Promise.all error', error)
        }

        const hasChanges = results
          .filter(res => res.status === 'fulfilled')
          .map(res => res.value)

        const hasErrored = results
          .filter(res => res.status === 'rejected')
          .map(res => res.value)

        updates.push(...hasChanges)
        errored.push(...hasErrored)

        batchNumber++
        updatedPlayers += batchOfPlayers.length
      }

      if (errored.length > 0) {
        console.error('massUpdatePlayers errored update:', errored)
      }

      await sendEmbeds(updates)

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
  const { status, embed } = await osuTrack.update({
    id: player.osu_id,
    mode: player.osu_mode
  })

  return {
    player,
    embed,
    status
  }
}

async function sendEmbeds (
  updates: Update[]
) {
  for (const update of updates) {
    if (!update) {
      continue
    }

    if (update.status === 'no_change') {
      console.log(`${update.player.osu_username} has no changes.`)
    }

    for (const channel of update.player.updatesChannels) {
      try {
        await channel.send({ embeds: [update.embed] })
        console.info(`${update.player.osu_username} in #${channel.name}`)
      } catch (error) {
        if (error.code === 50001) {
          console.error(`channel not found for ${update.player.osu_username} in #${channel.name} [guild:${channel.guildId}]`)
          continue
        }

        console.error('sendEmbeds: ', error)
      }
    }
  }
}

interface Update {
  player: TrackedPlayer
  embed: MessageEmbed
  status: 'first' | 'no_change' | 'update'
}
