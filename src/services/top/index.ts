import { CronJob } from 'cron'
import getTrackedPlayers from '../../utils/getTrackedPlayers'
import { Client } from 'discord.js'
import getNewTopPlays from './getNewTopPlays'
import updatePlayerState from './updatePlayerState'
import wait from '../../utils/wait'
import getEmbed from './getEmbed'
import { osuApiV2 } from '../../libs/osu'

const EVERY_30_MINUTES = '*/30 * * * *'

export default function update (client: Client): CronJob {
  console.log('Service started : top plays')

  const job = new CronJob({
    cronTime: EVERY_30_MINUTES,
    onTick: diffTopPlays,
    timeZone: 'Europe/Paris'
  })

  async function diffTopPlays () {
    try {
      console.time('diffTopPlays')

      const trackedPlayers = await getTrackedPlayers(client, 'track')

      console.log(
        `Top plays tracking service: ${trackedPlayers.uniqueTrackedPlayers.length} players to compare.`
      )

      for (const player of trackedPlayers.uniqueTrackedPlayers) {
        // Get the new top plays from a player
        const newScores = await osuApiV2.getUserBestScores({
          id: player.osu_id
        }).catch((error) => {
          console.error('diffTopPlays, getUserBestScores error', error)
        })

        if (!newScores) {
          continue
        }

        const newPlays = await getNewTopPlays(player, newScores)

        if (newPlays.length === 0) {
          continue
        }

        // If there is new plays send them to the channel
        for (const play of newPlays) {
          const embed = await getEmbed({ play, player })

          // Send the embed for each tracked channel linked to this player
          for (const channel of player.trackChannels) {
            channel.send({ embeds: [embed] }).catch((err) => console.error(err))

            console.log(
              `Sent new top play from ${player.osu_username} to #${channel.name}`
            )

            // Update the state of the player because we just checked its profile
            updatePlayerState(player)
          }
        }

        await wait(2000)
      }
    } catch (error) {
      console.error('diffTopPlays', error)
    } finally {
      console.timeEnd('diffTopPlays')
    }
  }

  return job
}
