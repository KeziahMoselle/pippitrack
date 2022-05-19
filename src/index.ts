import 'dotenv/config'

// API
import api from './api/index'

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
  Configure,
  Link,
  Gifted,
  Help,
  Osu,
  Peak,
  Ping,
  Score,
  Update,
  Track,
  Untrack,
  Tracklist,
  MpStat,
  Stacked
} from './commands'
import supabase from './libs/supabase'
import getTrackedPlayers from './utils/getTrackedPlayers'
import { Client } from 'discord.js'

const ENABLE_TOP_TRACKING = process.env.ENABLE_TOP_TRACKING === 'true'
const ENABLE_DAILY_UPDATE = process.env.ENABLE_DAILY_UPDATE === 'true'
const ENABLE_ORDR_TRACKING = process.env.ENABLE_ORDR_TRACKING === 'true'
const ENABLE_BEATMAPS_TRACKING = process.env.ENABLE_BEATMAPS_TRACKING === 'true'

api.start()

const bot = new Bot(client, process.env.DISCORD_BOT_TOKEN)

const EVERY_FIVE_MINUTES = 5 * 60 * 1000

bot.onReady = async (client: Client) => {
  console.log('Connected to Discord.')

  updatePresence(client)
  setInterval(() => updatePresence(client), EVERY_FIVE_MINUTES)
  cleanGuilds()

  // Run services

  if (process.env.NODE_ENV === 'development') {
    return console.warn('DEVELOPMENT MODE: Ignoring all services.')
  }

  if (ENABLE_TOP_TRACKING) {
    top(client).start()
  }
  if (ENABLE_DAILY_UPDATE) {
    update(client).start()
  }
  if (ENABLE_ORDR_TRACKING) {
    ordr(client).start()
  }
  if (ENABLE_BEATMAPS_TRACKING) {
    beatmaps(client).start()
  }
}

bot
  .addCommand(new Configure())
  .addCommand(new Link())
  .addCommand(new Gifted())
  .addCommand(new Help())
  .addCommand(new Osu())
  .addCommand(new Peak())
  .addCommand(new Ping(client))
  .addCommand(new Score())
  .addCommand(new Update())
  .addCommand(new Track())
  .addCommand(new Untrack())
  .addCommand(new Tracklist())
  .addCommand(new Configure())
  .addCommand(new MpStat())
  .addCommand(new Stacked())
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

async function cleanGuilds () {
  const { inactiveGuilds } = await getTrackedPlayers(client)

  if (inactiveGuilds.length === 0) return

  for (const guildId of inactiveGuilds) {
    const { data: users } = await supabase
      .from('tracked_users')
      .delete()
      .match({ guild_id: guildId })

    console.log(`Deleted ${users.length} tracked users.`)

    await supabase
      .from('guilds')
      .delete()
      .match({ guild_id: guildId })

    console.log(`Removed guild:${guildId}.`)
  }

  console.log(`Removed ${inactiveGuilds.length} guilds.`)
}
