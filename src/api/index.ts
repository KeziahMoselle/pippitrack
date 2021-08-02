import fastify from 'fastify'
import topPlays from './topPlays'

class Api {
  server = fastify()
  port = null

  constructor (port: number | string) {
    this.port = port

    this.routes()
  }

  routes (): void {
    this.server.post('/api/top_plays', topPlays)
  }

  start (): void {
    this.server.listen(this.port, (err, address) => {
      if (err) {
        console.error('API start error :', err)
      }

      console.log(`API is listening on : ${address}`)
    })
  }
}

export default Api
