import { default as axios } from 'axios'
import osuClient from 'node-osu'

export const osu = new osuClient.Api(process.env.OSU_API_KEY, {
  completeScores: true,
  parseNumeric: false,
  notFoundAsError: false
})

class OsuApiv2 {
  base = 'https://osu.ppy.sh/api/v2/'
  userUrlBase = 'https://osu.ppy.sh/users/'
  avatarUrl = 'http://s.ppy.sh/a/'
  clientId = null
  clientSecret = null
  token = null
  tokenExpire = null

  constructor (clientId, clientSecret) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async getToken () {
    const { data } = await axios.post('https://osu.ppy.sh/oauth/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
      scope: 'public'
    })

    this.token = data.access_token
    this.tokenExpire = new Date(Date.now() + (data.expires_in * 1000))
  }

  async fetch (endpoint, params = {}) {
    // Check if the token is expired
    if ((this.tokenExpire && new Date() > this.tokenExpire) || !this.tokenExpire) {
      console.log('osu! API v2 access_token is expired or needs to be created')
      await this.getToken()
    }

    const url = new URL(`${this.base}${endpoint}`)

    for (const key in params) {
      const value = params[key]
      url.searchParams.append(key, value)
    }

    try {
      const { data } = await axios.get(url.href, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })

      return data
    } catch (error) {
      console.error(url, error)
    }
  }

  async getUserAchievements ({ id, username }: { id?: number, username?: string }) {
    const user = await this.fetch(`users/${id || username}`)
    return user.user_achievements
  }

  async getUserRecentScores ({ id, includeFails = '1', limit = 1 }) {
    const scores = await this.fetch(`users/${id}/scores/recent`, {
      include_fails: includeFails,
      limit
    })

    return scores
  }

  getBeatmapsetCoverImage = (beatmapsetId) => `https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/cover.jpg`
}

export const osuApiV2 = new OsuApiv2(process.env.OSU_CLIENT_ID, process.env.OSU_CLIENT_SECRET)
