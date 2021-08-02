import fastify from 'fastify'
import profile from './profile'

class Api {
  server = fastify()
  port = 80

  constructor (port: number) {
    this.port = port

    this.routes()
  }

  routes (): void {
    this.server.get('/api/profile', profile)
  }

  start (): void {
    this.server.listen(this.port, (err, address) => {
      if (err) {
        console.error(err)
      }

      console.log(`Server listening on ${address}`)
    })
  }
}

export default Api
