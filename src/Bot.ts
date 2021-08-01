import { Client, Message } from 'discord.js'
import handleTrackBtn from './buttons/handleTrackBtn'
import handleUntrackBtn from './buttons/handleUntrackBtn'
import getPrefixes from './utils/getPrefixes'
import { defaultPrefix } from './config'
import handleUntrackAllBtn from './buttons/handleUntrackAllBtn'

export default class Bot {
  apiKey = '' // Discord API Key
  client = null // The Discord Client

  commands = new Map()
  prefixes = new Map()

  onReady = null

  constructor (client: Client, apiKey: string) {
    this.client = client
    this.apiKey = apiKey

    this.client.once('ready', async () => {
      if (this.onReady && typeof this.onReady === 'function') {
        this.onReady(this.client)
        console.log(`Using ${process.env.NODE_ENV} prefix : ${defaultPrefix}`)
      }
    })

    // Add listeners here
    this.client.on('message', this.onMessage)
    this.client.on('clickButton', this.onClickButton)
  }

  /**
   * Run a command if it's the bot prefix
   *
   * @param {module:discord.js.Message} message
   * @memberof Bot
   */
  onMessage = (message: Message): void => {
    if (
      message.author.bot ||
      message.channel.type === 'dm' ||
      message.type === 'GUILD_MEMBER_JOIN'
    ) {
      return
    }

    const prefix = this.prefixes.get(message.guild.id) || defaultPrefix

    if (!message.content.startsWith(prefix)) return

    this.runCommand(message, prefix)
  }

  /**
   * Listen for clicks on buttons
   *
   * @memberof Bot
   */
  onClickButton = async (button): Promise<void> => {
    const [btnId] = button.id.split('_')

    try {
      if (btnId === 'untrack') {
        return handleUntrackBtn(button)
      }

      if (btnId === 'track') {
        return handleTrackBtn(button, this.client)
      }

      if (btnId === 'untrackall') {
        return handleUntrackAllBtn(button)
      }
    } catch (error) {
      console.error('onClickButton', error)
      await button.reply.send('Sorry, there was an error.', true)
    }
  }

  /**
   * Add a command to the bot's list
   *
   * @param {Object} command
   * @returns
   * @memberof Bot
   */
  addCommand = (command): this => {
    if (!command.run) {
      console.error(`"${command.name}" does not have a method named "run"`)
    }

    if (!command.name) {
      console.error(`"${command.name}" does not have a property named "name"`)
    }

    if (!command.arguments) {
      console.error(
        `"${command.name}" does not have a property named "arguments"`
      )
    }

    if (!command.description) {
      console.error(
        `"${command.name}" does not have a property named "description"`
      )
    }

    if (!command.category) {
      console.error(
        `"${command.name}" does not have a property named "category"`
      )
    }

    this.commands.set(command.name, command)
    return this
  }

  /**
   * Run the right command according to the message
   *
   * @param {Message} message
   * @memberof Bot
   */
  runCommand = async (message: Message, prefix: string): Promise<void> => {
    const content = message.content.toLowerCase()
    const parts = content.split(' ')
    const args = parts.slice(1)
    const commandName = parts[0].replace(prefix, '').toLowerCase()
    const command = this.commands.get(commandName)

    if (!command) return

    try {
      message.channel.startTyping()
      await command.run(message, args)
    } catch (error) {
      console.error('Error catched Bot.js:', error, JSON.stringify(error))
      message.channel.send('Sorry there was an error with an external service.')
    } finally {
      message.channel.stopTyping()
    }
  }

  fetchPrefixes = async (): Promise<void> => {
    console.log('Fetching guilds prefixes...')
    const guilds = await getPrefixes()

    for (const guild of guilds) {
      this.prefixes.set(guild.guild_id, guild.prefix)
    }

    console.log('Fetching guilds prefixes done!')
  }

  /**
   * Run the bot
   *
   * @memberof Bot
   */
  run = async (): Promise<void> => {
    await this.fetchPrefixes()
    console.log('Connecting to Discord...')
    try {
      await this.client.login(this.apiKey)
    } catch (error) {
      console.error('Error while connecting to Discord :', error)
    }
  }
}
