import fastify from 'fastify'
import getToken from './getToken'
import topPlays from './topPlays'

class Api {
  server = fastify()
  port = null

  constructor (port: number | string) {
    this.port = port

    this.routes()
  }

  routes (): void {
    this.server.get('/', (request, reply) => {
      reply.code(200).send('POST /api/top_plays')
    })

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
