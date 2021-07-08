// Setup Discord
const Bot = require('./Bot.js')
const client = require('./libs/client')

// Commands
const {
  Track,
  Peak,
  Help,
  Link
} = require('./commands')

const bot = new Bot(client, process.env.DISCORD_BOT_TOKEN)

bot
  .addCommand(new Track())
  .addCommand(new Peak())
  .addCommand(new Link())
  .addCommand(new Help(bot.commands))
  .run()