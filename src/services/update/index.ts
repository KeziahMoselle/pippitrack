import { CronJob } from 'cron'
import getTrackedPlayers from '../../utils/getTrackedPlayers'
import wait from '../../utils/wait'
import {
  maxUsersUpdatedSimultaneously,
  maxRequestsBeforeSleep
} from '../../config'
import { Client, MessageEmbed } from 'discord.js'
import { TrackedPlayer } from '../../types'
import { update } from '../../libs/update'

const EVERY_WEEK = '0 0 0 * * 6'
const FIVE_SECONDS = 5 * 1000

export default function updateService (client: Client): CronJob {
  console.log('Service started : update players every week')

  const job = new CronJob({
    cronTime: EVERY_WEEK,
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

      // Update all the players
      while (uniqueTrackedPlayers.length > 0) {
        if (updatedPlayers >= maxRequestsBeforeSleep) {
          // wait to avoid too many requests
          await wait(FIVE_SECONDS)
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
        const results = await Promise.allSettled(fetches)
        const updates = results
          .filter(result => result.status === 'fulfilled')
          // @ts-expect-error allSettled typing is weird
          .map(result => result.value)

        sendEmbeds(updates)

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
  const { type, embed } = await update({
    id: player.osu_id,
    selectedMode: player.osu_mode
  })

  return {
    player,
    embed,
    type
  }
}

async function sendEmbeds (
  updates: Update[]
) {
  for (const update of updates) {
    if (!update) {
      continue
    }

    if (update.type === 'no_change') {
      return console.log(`${update.player.osu_username} has no changes.`)
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
  type: 'first' | 'no_change' | 'update'
}
