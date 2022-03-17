import { Client, Intents } from 'discord.js'

// Declare intents
const intents = new Intents([
  // We want the 'guildCreate' event.
  Intents.FLAGS.GUILDS,
  // We still want this intent to send errors messages
  Intents.FLAGS.GUILD_MESSAGES
])

const client = new Client({
  intents
})

export default client
