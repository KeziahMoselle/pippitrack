import { Client, Collection, Guild, Interaction, MessageEmbed, MessageInteraction, Permissions } from 'discord.js'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { BaseDiscordCommand } from './types'
import MpStat from './commands/MpStat'
import supabase from './libs/supabase'

export default class Bot {
  apiKey = '' // Discord API Key
  client: Client = null // The Discord Client

  rest = new REST({ version: '9' })

  commands = new Collection<string, BaseDiscordCommand>()

  onReady = null

  MpStat = new MpStat()

  constructor (client: Client, apiKey: string) {
    this.client = client
    this.apiKey = apiKey
    this.rest.setToken(apiKey)

    this.client.once('ready', async () => {
      if (this.onReady && typeof this.onReady === 'function') {
        this.onReady(this.client)
      }

      this.initSlashCommands()
    })

    // Add listeners here
    this.client.on('guildCreate', this.onGuildCreate)
    this.client.on('guildDelete', this.onGuildDelete)
    this.client.on('interactionCreate', this.onInteractionCreate)
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
      console.error('Error while running command', error, interaction)
      await interaction.reply({
        content: 'Sorry, There was an error. (We are probably working on a fix at this very moment)',
        ephemeral: true
      })
    }
  }

  initSlashCommands = async (): Promise<void> => {
    try {
      console.log('Started refreshing application (/) commands.')

      const body = this.commands.map(command => command.data.toJSON())

      if (process.env.NODE_ENV === 'development') {
        await this.rest.put(
          Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID,
            process.env.DISCORD_GUILD_ID
          ),
          { body }
        )
      }

      if (process.env.NODE_ENV === 'production') {
        await this.rest.put(
          Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
          { body }
        )
      }

      console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Send some basic instructions on guild join
   */
  onGuildCreate = (guild: Guild): void => {
    console.log(`${guild.name} (${guild.id}) has been added.`)

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
            'Administrators can configure the server by typing `/configure`.\n' +
            'Users can link their Discord to an osu! profile by typing `/link username`\n' +
            'Type / to see a list of commands.\n' +
            'If you need help you can [join the support server](http://discord.pippitrack.com/) and ask for help there!'
        )
        .setFooter({
          text: 'Happy tracking !'
        })
        .setColor(5814783)

      guild.systemChannel.send({ embeds: [embed] })
    }
  }

  /**
   * Delete all data related to guild
   */
  onGuildDelete = async (guild: Guild): Promise<void> => {
    const { data: users } = await supabase
      .from('tracked_users')
      .delete()
      .match({ guild_id: guild.id })

    console.log(`Deleted ${users.length} tracked users.`)

    const { error } = await supabase
      .from('guilds')
      .delete()
      .match({ guild_id: guild.id })

    if (error) {
      console.log(error)
    }

    console.log(`${guild.name} (${guild.id}) has been removed.`)
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
   * Run the bot
   *
   * @memberof Bot
   */
  run = async (): Promise<void> => {
    console.log('Connecting to Discord...')
    try {
      await this.client.login(this.apiKey)
    } catch (error) {
      console.error('Error while connecting to Discord :', error)
    }
  }
}
