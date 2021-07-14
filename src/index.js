require('dotenv').config()

// Setup Discord
const Bot = require('./Bot.js')
const client = require('./libs/client')
const updatePresence = require('./utils/updatePresence')

// Services
const ordr = require('./services/ordr')
const update = require('./services/update')

// Commands
const {
  Track,
  Peak,
  Help,
  Link,
  Update,
  Ping
} = require('./commands')

const bot = new Bot(client, process.env.DISCORD_BOT_TOKEN)

const EVERY_FIVE_MINUTES = 5 * 60 * 1000

bot.onReady = (client) => {
  console.log('Connected to Discord.')

  updatePresence(client)
  setInterval(() => updatePresence(client), EVERY_FIVE_MINUTES);

  // Run services
  ordr(client).start()
  update(client).start()
}

bot
  .addCommand(new Track())
  .addCommand(new Update())
  .addCommand(new Peak())
  .addCommand(new Link())
  .addCommand(new Ping(bot.client))
  .addCommand(new Help(bot.commands))
  .run()