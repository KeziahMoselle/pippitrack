// Setup Discord
const Bot = require('./Bot.js')
const client = require('./libs/client')

// Services
const ordr = require('./services/ordr')

// Commands
const {
  Track,
  Peak,
  Help,
  Link,
  Update
} = require('./commands')

const bot = new Bot(client, process.env.DISCORD_BOT_TOKEN)

bot.onReady = (client) => {
  console.log('Connected to Discord.')

  client.user.setPresence({
    activity: {
      name: '!help'
    }
  })

  // Run services
  ordr(client).start()
}

bot
  .addCommand(new Track())
  .addCommand(new Update())
  .addCommand(new Peak())
  .addCommand(new Link())
  .addCommand(new Help(bot.commands))
  .run()