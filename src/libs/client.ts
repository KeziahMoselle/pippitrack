import { Client, Intents } from 'discord.js'
import disbut from 'discord-buttons'

// Declare intents
const intents = new Intents(['GUILDS', 'GUILD_MESSAGES'])

const client = new Client({
  ws: { intents }
})

// Add Discord buttons integration
disbut(client)

export default client
