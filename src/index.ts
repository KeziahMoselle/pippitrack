import './utils/setup'

// Setup Discord
import Bot from './Bot'
import client from './libs/client'
import updatePresence from './utils/updatePresence'

// Services
import ordr from './services/ordr'
import update from './services/update'

// Commands
import {
  Track,
  Peak,
  Help,
  Link,
  Update,
  Ping,
  SetChannel,
  Osu,
  RecentScore,
  Untrack,
  Tracklist
} from './commands'

const bot = new Bot(client, process.env.DISCORD_BOT_TOKEN)

const EVERY_FIVE_MINUTES = 5 * 60 * 1000

bot.onReady = (client) => {
  console.log('Connected to Discord.')

  if (process.env.NODE_ENV !== 'production') {
    return
  }

  updatePresence(client)
  setInterval(async () => await updatePresence(client), EVERY_FIVE_MINUTES)

  // Run services
  ordr(client).start()
  update(client).start()
}

bot
  .addCommand(new Link())
  .addCommand(new Track())
  .addCommand(new Update())
  .addCommand(new RecentScore())
  .addCommand(new Osu())
  .addCommand(new Peak())
  .addCommand(new SetChannel())
  .addCommand(new Untrack())
  .addCommand(new Tracklist())
  .addCommand(new Ping(bot.client))
  .addCommand(new Help())
  .run()

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
})
