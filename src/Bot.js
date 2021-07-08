class Bot {
  apiKey = '' // Discord API Key
  client = null // The Discord Client

  prefix = '!'

  commands = []

  constructor (client, apiKey) {
    this.client = client
    this.apiKey = apiKey

    this.client.once('ready', async () => {
      console.log('Connected to Discord.')
      this.client.user.setPresence({
        activity: {
          name: '!track <username>'
        }
      })
    })

    this.client.on('message', this.onMessage)
  }

  /**
   * Run a command if it's the bot prefix
   *
   * @param {module:discord.js.Message} message
   * @memberof Bot
   */
  onMessage = (message) => {
    if (
      message.author.bot ||
      message.channel.type === 'dm' ||
      message.type === 'GUILD_MEMBER_JOIN'
    ) {
      return
    }

    if (!message.content.startsWith(this.prefix)) return

    this.runCommand(message)
  }

  /**
   * Add a command to the bot's list
   *
   * @param {Object} command
   * @returns
   * @memberof Bot
   */
  addCommand = (command) => {
    if (!command.run) {
      console.error(`"${command.name}" does not have a function named "run"`)
    }

    if (!command.name) {
      console.error(`"${command.name}" does not have a property named "name"`)
    }

    if (!command.arguments) {
      console.error(`"${command.name}" does not have a property named "arguments"`)
    }

    if (!command.description) {
      console.error(`"${command.name}" does not have a property named "description"`)
    }

    if (!command.category) {
      console.error(`"${command.name}" does not have a property named "category"`)
    }

    this.commands.push(command)
    return this
  }

  /**
   * Run the right command according to the message
   *
   * @param {Message} message
   * @memberof Bot
   */
  runCommand = (message) => {
    const content = message.content.toLowerCase()
    const parts = content.split(' ')
    const args = parts.slice(1)
    const commandName = (parts[0].replace(this.prefix, '')).toLowerCase()
    const command = this.commands.find(c => c.name === commandName)

    if (!command) return false

    command.run(message, args)
  }

  /**
   * Run the bot
   *
   * @memberof Bot
   */
  run = async () => {
    console.log('Connecting to Discord...')
    await this.client.login(this.apiKey)
  }
}

module.exports = Bot
