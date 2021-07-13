const { MessageEmbed } = require('discord.js')

const PREFIX = '!'

class Help {
  name = 'help'
  arguments = '<command>'
  description = 'Display a list of commands'
  category = 'general'

  defaultEmbed = new MessageEmbed()

  commandsEmbed = new Map()

  constructor (commands) {
    this.setDefaultEmbed(commands)

    for (const command of commands) {
      this.setCommandEmbed(command)
    }
  }

  /**
   * Set the default embed for all commands
   */
  setDefaultEmbed(commands) {
    this.defaultEmbed
      .setTitle(`osu!track's commands`)

    const description = commands.reduce((desc, command) => {
      return desc += `**${command.description}**\n\`${PREFIX}${command.name} ${this.getArgumentsList(command.arguments)}\`\n\n`
    }, '')

    this.defaultEmbed
      .setDescription(description)
      .setFooter(`For more details on a specific command : ${PREFIX}help <command>`)
  }


  /**
   * Set a help command for a specific command
   */
  setCommandEmbed(command) {
    const commandEmbed = new MessageEmbed()
      .setTitle(`Help for command : ${command.name}`)
      .setDescription(command.description)

    this.commandsEmbed.set(command.name, commandEmbed)
  }


  /**
   * Take an array of arguments and returns a string
   * like : <argument1> <argument2>
   *
   * @param {string[]} commandArguments
   * @returns {string}
   */
  getArgumentsList(commandArguments) {
    return commandArguments
      .reduce(
        (allArguments, argument) => allArguments += `<${argument}> `,
        ''
      )
  }

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const [firstArg] = args

    // Send command specific help
    if (firstArg) {
      const embed = this.commandsEmbed.get(firstArg)

      if (!embed) {
        return
      }

      return message.channel.send(embed)
    }

    // Send all commands help
    return message.channel.send(this.defaultEmbed)
  }
}

module.exports = Help
