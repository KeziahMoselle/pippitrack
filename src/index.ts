import './utils/setup'
import { apiPort } from './config'

// API
import Api from './api'

// Setup Discord
import Bot from './Bot'
import client from './libs/client'
import updatePresence from './utils/updatePresence'

// Services
import ordr from './services/ordr'
import update from './services/update'
import top from './services/top'
import beatmaps from './services/beatmaps'

// Subscribers
import trackedUsers from './subscribers/trackedUsers'

// Commands
import {
  Track,
  Peak,
  Help,
  Link,
  Update,
  Ping,
  Osu,
  Tracklist,
  Configure,
  Score,
  Gifted
} from './commands'

const api = new Api(apiPort).start()

const bot = new Bot(client, process.env.DISCORD_BOT_TOKEN)

const EVERY_FIVE_MINUTES = 5 * 60 * 1000

bot.onReady = (client) => {
  console.log('Connected to Discord.')

  updatePresence(client)
  setInterval(async () => await updatePresence(client), EVERY_FIVE_MINUTES)

  // Run services

  if (process.env.NODE_ENV === 'development') return console.log('Development mode: ignoring services.')

  top(client).start()
  update(client).start()
  ordr(client).start()
  beatmaps(client).start()
}

bot
  /* .addCommand(new Link())
  .addCommand(new Track())
  .addCommand(new Update())
  .addCommand(new Osu())
  .addCommand(new Peak())
  .addCommand(new Tracklist()) */
  .addCommand(new Configure())
  /* .addCommand(new Ping(bot.client))
  .addCommand(new Help())
  .addCommand(new Score())
  .addCommand(new Gifted()) */
  .run()

// Run subscribers
trackedUsers()

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, exiting gracefully.')
  bot.client.destroy()
  await api.close()
  process.exit()
})
