import { Client, Intents } from 'discord.js'

// Declare intents
const intents = new Intents([
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES
])

const client = new Client({
  intents
})

export default client
