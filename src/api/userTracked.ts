import client from '../libs/client'
import getTrackedPlayers from '../utils/getTrackedPlayers'

interface TextResponse {
  message: string
}

export default async function userTracked (
  request,
  reply
): Promise<TextResponse> {
  reply.header('Access-Control-Allow-Origin', '*')

  try {
    const osuId = request?.query?.osu_id

    if (!osuId) {
      reply.code(400)

      return {
        message: 'Query parameter "osu_id" not found.'
      }
    }

    const { uniqueTrackedPlayers } = await getTrackedPlayers(
      client,
      'track',
      osuId
    )

    if (uniqueTrackedPlayers.length === 0) {
      reply.code(404)

      return {
        message: 'No tracked players'
      }
    }

    const [player] = uniqueTrackedPlayers

    if (player.trackChannels.length === 0) {
      reply.code(404)

      return {
        message: 'Player found but no tracked channels.'
      }
    }

    reply.code(200)
    return {
      message: 'Player exists.'
    }
  } catch (error) {
    console.error('API topPlays POST error :', error)
  }
}
