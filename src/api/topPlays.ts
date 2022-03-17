import client from '../libs/client'
import getEmbed from '../services/top/getEmbed'
import getNewTopPlays from '../services/top/getNewTopPlays'
import updatePlayerState from '../services/top/updatePlayerState'
import { Score } from '../types/osu'
import getTrackedPlayers from '../utils/getTrackedPlayers'

interface TextResponse {
  message: string
}

export default async function topPlays (
  request,
  reply
): Promise<Score[] | TextResponse> {
  reply.header('Access-Control-Allow-Origin', '*')

  try {
    // Top plays are coming from the browser extension.
    const newScores: Score[] = JSON.parse(request.body)
    const osuId = `${newScores[0].user_id}`

    const { uniqueTrackedPlayers } = await getTrackedPlayers(
      client,
      'track',
      osuId
    )

    if (uniqueTrackedPlayers.length === 0) {
      return {
        message: 'No tracked players'
      }
    }

    const [player] = uniqueTrackedPlayers

    // Get only the new top plays from all the new scores
    const newPlays = await getNewTopPlays(player, newScores)

    if (newPlays.length === 0) {
      return {
        message: 'No new scores !'
      }
    }

    // If there is new plays send them to the channel
    for (const play of newPlays) {
      const embed = await getEmbed({ play, player })

      // Send the embed for each tracked channel linked to this player
      for (const channel of player.trackChannels) {
        channel.send({ embeds: [embed] }).catch((err) => console.error(err))

        console.log(
          `API: Sent new top play from ${player.osu_username} to #${channel.name}`
        )

        // Update the state of the player because we just checked its profile
        updatePlayerState(player)
      }
    }

    return newPlays
  } catch (error) {
    console.error('API topPlays POST error :', error)
  }
}
