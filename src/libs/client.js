const { Client } = require('discord.js')
const buttons = require('discord-buttons')

const client = new Client()
buttons(client)

module.exports = client