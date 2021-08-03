import fastify from 'fastify'
import getToken from './getToken'
import topPlays from './topPlays'
import userTracked from './userTracked'

class Api {
  server = fastify()
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
          'GET /api/user_tracked - Check if a player is tracked\n' +
            'POST /api/top_plays - Get new top plays and send it to Discord\n' +
            'POST /api/get_token - Get access_token for osu! OAuth'
        )
    })

    this.server.get('/api/user_tracked', userTracked)
    this.server.post('/api/top_plays', topPlays)
    this.server.post('/api/get_token', getToken)
  }

  start (): void {
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
  }
}

export default Api
