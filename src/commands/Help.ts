import { MessageEmbed } from 'discord.js';

const PREFIX = '!'

export default class Help {
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
   *
   * @param {Set} commands
   */
  setDefaultEmbed (commands) {
    this.defaultEmbed
      .setTitle('osu!track\'s commands')

    let description = ''
    commands.forEach(command => {
      description += `**${command.description}**\n\`${PREFIX}${command.name} ${this.getArgumentsList(command.arguments)}\`\n\n`
    })

    description += '\nSupport : [GitHub](https://github.com/KeziahMoselle/osu-track)'

    this.defaultEmbed
      .setDescription(description)
      .setFooter(`For more details on a specific command: ${PREFIX}help <command>`)
  }

  /**
   * Set a help command for a specific command
   */
  setCommandEmbed (command) {
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
  getArgumentsList (commandArguments) {
    return commandArguments
      .reduce(
        (allArguments, argument) => {
          allArguments += `<${argument}> `
          return allArguments
        },
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
