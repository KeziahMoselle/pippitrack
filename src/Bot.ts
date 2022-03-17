import { Client, Collection, Guild, Interaction, Message, MessageEmbed, MessageInteraction, Permissions } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import getPrefixes from './utils/getPrefixes'
import { defaultPrefix } from './config'
import prefixes from './libs/prefixes'
import { BaseDiscordCommand } from './types'

export default class Bot {
  apiKey = '' // Discord API Key
  client: Client = null // The Discord Client

  rest = new REST({ version: '9' })

  commands = new Collection<string, BaseDiscordCommand>()

  onReady = null

  constructor (client: Client, apiKey: string) {
    this.client = client
    this.apiKey = apiKey
    this.rest.setToken(apiKey)

    this.client.once('ready', async () => {
      if (this.onReady && typeof this.onReady === 'function') {
        this.onReady(this.client)
        console.log(`Using ${process.env.NODE_ENV} prefix : ${defaultPrefix}`)
      }

      this.initSlashCommands()
    })

    // Add listeners here
    this.client.on('messageCreate', this.onMessage)
    this.client.on('guildCreate', this.onGuildCreate)
    this.client.on('interactionCreate', this.onInteractionCreate)
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
      message.channel.type === 'DM' ||
      message.type === 'GUILD_MEMBER_JOIN'
    ) {
      return
    }

    const prefix = prefixes.get(message.guild.id) || defaultPrefix

    if (!message.content.startsWith(prefix)) return

    this.runCommand(message, prefix)
  }

  /**
   * Run a / command
   */
  onInteractionCreate = async (interaction: Interaction): Promise<void> => {
    if (interaction.isSelectMenu()) {
      const messageInteraction = interaction.message.interaction as MessageInteraction
      const command = this.commands.get(messageInteraction.commandName)
      command.handleSelect(interaction)
    }

    if (!interaction.isCommand()) return

    const command = this.commands.get(interaction.commandName)

    if (!command) return

    try {
      await command.run(interaction)
    } catch (error) {
      console.error('Error while running command', error)
      await interaction.reply({
        content: 'Sorry, There was an error. (We are probably working on a fix at this very moment)',
        ephemeral: true
      })
    }
  }

  initSlashCommands = async (): Promise<void> => {
    try {
      console.log('Started refreshing application (/) commands.')

      await this.rest.put(
        Routes.applicationGuildCommands(
          '869554664327221248',
          '869542280158150707'
        ),
        { body: this.commands.map(command => command.data.toJSON()) }
      )

      console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Send some basic instructions on guild join
   */
  onGuildCreate = (guild: Guild): void => {
    const hasPerms = guild.me.permissions.has([
      Permissions.FLAGS.SEND_MESSAGES,
      Permissions.FLAGS.MANAGE_MESSAGES,
      Permissions.FLAGS.ATTACH_FILES,
      Permissions.FLAGS.EMBED_LINKS,
      Permissions.FLAGS.ATTACH_FILES,
      Permissions.FLAGS.READ_MESSAGE_HISTORY,
      Permissions.FLAGS.ADD_REACTIONS,
      Permissions.FLAGS.USE_EXTERNAL_EMOJIS
    ])

    if (!hasPerms) {
      console.info(`${guild.name} doesn't have the required permissions.`)

      if (
        guild.systemChannel &&
        guild.systemChannel.permissionsFor(guild.me).has('SEND_MESSAGES')
      ) {
        const embed = new MessageEmbed()
          .setTitle(
            `${this.client.user.username} does not have enough permissions :(`
          )
          .setDescription(
            'Administrators please check if the bot has the following permissions :\n' +
              'Send Messages, Manage Messages, Attach Files, Embed Links, Attach Files, Read Message History, Add Reactions, Use External Emojis.'
          )
          .setColor(14504273)

        guild.systemChannel.send({ embeds: [embed] })
      }
    }

    if (
      guild.systemChannel &&
      guild.systemChannel.permissionsFor(guild.me).has('SEND_MESSAGES')
    ) {
      const embed = new MessageEmbed()
        .setTitle('Thank you for inviting me ! :blush:')
        .setDescription(
          '**Here some instructions to get you started**\n' +
            'Administrators can configure the server by typing `!config`.\n' +
            'Users can link their Discord to an osu! profile by typing `!u yourUsername`\n' +
            'And you can find the documentation by typing the `!help` command !\n' +
            'If you need help you can [join the support server](https://discord.gg/bNQUZeHFdR) and ask for help there !'
        )
        .setFooter({
          text: 'Happy tracking !'
        })
        .setColor(5814783)

      guild.systemChannel.send({ embeds: [embed] })
    }
  }

  /**
   * Add a command to the bot's list
   *
   * @param {Object} command
   * @returns
   * @memberof Bot
   */
  addCommand = (command: BaseDiscordCommand): this => {
    this.commands.set(command.data.name, command)
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
      await message.channel.sendTyping()
      await command.run(message, args)
    } catch (error) {
      console.error('Error catched Bot.js:', error, JSON.stringify(error))
      message.channel.send('Sorry there was an error with an external service.')
    }
  }

  fetchPrefixes = async (): Promise<void> => {
    console.log('Fetching guilds prefixes...')
    const guilds = await getPrefixes()

    for (const guild of guilds) {
      prefixes.set(guild.guild_id, guild.prefix)
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
