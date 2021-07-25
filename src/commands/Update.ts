import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import osuTrack from '../libs/osutrack'

export default class UpdateCommand {
  name = 'u'
  arguments = ['username']
  description =
    "See how much pp, rank, etc. you've gained since your last update"

  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
    }

    try {
      const { embed } = await osuTrack.update(user)

      return message.channel.send(embed)
    } catch (error) {
      console.error(error)
      return message.reply('Sorry, there was an error.')
    }
  }
}
