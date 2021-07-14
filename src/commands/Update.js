const { MessageEmbed } = require('discord.js')
const axios = require('axios').default
const supabase = require('../libs/supabase')
const { osu } = require('../libs/osu')
const getUser = require('../utils/getUser')
const getEmoji = require('../utils/getEmoji')
const notFoundEmbed = require('../utils/notFoundEmbed')
const { getUpdate } = require('../api')


class UpdateCommand {
  name = 'u'
  arguments = ['username']
  description = "See how much pp, rank, etc. you've gained since your last update"
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
   async run (message, args) {
    const user = await getUser({ message, args })

    if (!user || user.length === 0) {
      return message.channel.send(notFoundEmbed)
    }

    try {
      const embed = await getUpdate(user)

      return message.channel.send(embed)
    } catch (error) {
      console.error(error)
      return message.reply(`Sorry, there was an error.`)
    }
  }
}

module.exports = UpdateCommand