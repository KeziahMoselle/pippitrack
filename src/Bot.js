const untrackUser = require('./utils/untrackUser')
const { MessageEmbed } = require('discord.js')
const { MessageButton } = require('discord-buttons')
const supabase = require('./libs/supabase')
const getTrackChannels = require('./utils/getTrackChannels')

class Bot {
  apiKey = '' // Discord API Key
  client = null // The Discord Client

  prefix = '!'

  commands = []

  constructor (client, apiKey) {
    this.client = client
    this.apiKey = apiKey

    this.client.once('ready', async () => {
      if (this.onReady && typeof this.onReady === 'function') {
        this.onReady(this.client)
      }
    })

    this.client.on('message', this.onMessage)

    this.client.on('clickButton', this.onClickButton)
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
   * Listen for clicks on buttons
   *
   * @memberof Bot
   */
  onClickButton = async (button) => {
    try {
      const [btnId] = button.id.split('_')

      if (btnId === 'untrack') {
        const [, id] = button.id.split('_')

        // Check if the author has the permission to untrack the user
        if (!button.clicker.member.hasPermission('ADMINISTRATOR')) {
          return button.reply.send('You need to be an Administrator to untrack players.', true)
        }

        await button.reply.defer()

        const { data: untrackedUser, error } = await untrackUser(id)

        if (error) {
          return await button.reply.send('Sorry, there was an error.', true)
        }

        const embed = new MessageEmbed()
          .setTitle(`${untrackedUser.osu_username} has been untracked`)

        const untrackBtn = new MessageButton()
          .setStyle('grey')
          .setLabel('Untracked')
          .setID('untrack_disabled')
          .setDisabled()

        await button.message.edit(embed, untrackBtn)
      }

      if (btnId === 'track') {
        const [, id, userDiscordId, guildId] = button.id.split('_')

        await button.reply.defer()

        const { error } = await supabase
          .from('tracked_users')
          .update({ is_approved: true })
          .eq('id', id)
          .single()

        if (error) {
          return button.reply.send('Sorry, there was an error.', true)
        }

        const approvedBtn = new MessageButton()
          .setStyle('blurple')
          .setLabel('Approved')
          .setID('track_approved')
          .setDisabled()

        button.message.edit(button.message.embeds[0], approvedBtn)

        const { trackChannel } = await getTrackChannels(guildId, this.client)
        trackChannel.send(`<@${userDiscordId}> is now tracked.`)
      }
    } catch (error) {
      console.error(error)
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
  runCommand = async (message) => {
    const content = message.content.toLowerCase()
    const parts = content.split(' ')
    const args = parts.slice(1)
    const commandName = (parts[0].replace(this.prefix, '')).toLowerCase()
    const command = this.commands.find(c => c.name === commandName)

    if (!command) return false

    try {
      message.channel.startTyping()
      await command.run(message, args)
    } catch (error) {
      console.error(error)
    } finally {
      message.channel.stopTyping()
    }
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
