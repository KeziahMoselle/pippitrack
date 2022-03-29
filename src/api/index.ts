import Fastify from 'fastify'
import getToken from './getToken'
import topPlays from './topPlays'
import totalUsers from './totalUsers'
import userTracked from './userTracked'
import stats from './stats'
import { apiPort } from '../config'

class Api {
  server = Fastify()
  port = null

  constructor (port: number | string) {
    this.port = port

    this.routes()
  }

  routes (): void {
    this.server.get('/', (request, reply) => {
      reply
        .code(200)
        .send(
          'GET /v1/user_tracked - Check if a player is tracked\n' +
            'GET /v1/total_users - Return the total count of tracked players\n' +
            'POST /v1/top_plays - Send new top plays to this endpoint and it will send the new ones to Discord\n' +
            'POST /v1/get_token - Get an access_token for osu! OAuth (create and refresh token)'
        )
    })

    this.server.get('/v1/user_tracked', userTracked)
    this.server.get('/v1/total_users', totalUsers)
    this.server.get('/v1/stats', stats)
    this.server.post('/v1/top_plays', topPlays)
    this.server.post('/v1/get_token', getToken)
  }

  start (): this {
    this.server.listen(
      this.port,
      process.env.NODE_ENV === 'production' ? '0.0.0.0' : undefined,
      (err, address) => {
        if (err) {
          console.error('API start error :', err)
          process.exit(1)
        }

        console.log(`API is listening at : ${address}`)
      }
    )

    return this
  }

  close () {
    return this.server.close()
  }
}

const api = new Api(apiPort)

export default api
