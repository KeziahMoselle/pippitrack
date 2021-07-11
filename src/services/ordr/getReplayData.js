const axios = require('axios').default
const { osu } = require('../../libs/osu')

const REPLAY_ID_ENDPOINT = `https://ordr-api.issou.best/renders`

async function getReplayData(render_done) {
  try {
    const response = await axios.get(REPLAY_ID_ENDPOINT, {
      params: {
        renderId: render_done
      }
    })

    const replay = response.data.renders[0]

    const user = await osu.getUser({
      u: replay.replayUsername
    })

    return {
      replay,
      user
    }
  } catch (error) {
    console.error(error)
    return
  }
}

module.exports = getReplayData