import { Client, Intents } from 'discord.js'
import disbut from 'discord-buttons'

// Declare intents
const intents = new Intents([
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MEMBERS
])

const client = new Client({
  ws: { intents }
})

// Add Discord buttons integration
disbut(client)

export default client
