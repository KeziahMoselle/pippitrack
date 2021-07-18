import getUser from '../utils/getUser';
import notFoundEmbed from '../utils/notFoundEmbed';

export default class OsuProfileCommand {
  name = 'osu'
  arguments = ['username']
  description = 'Display your osu! profile (via osusig)'
  category = 'osu'

  IMAGE_ENDPOINT = (id) => `https://lemmmy.pw/osusig/sig.php?colour=pink&uname=${id}&pp=1&darktriangles&onlineindicator=undefined&xpbar&xpbarhex`

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send(notFoundEmbed)
    }

    return message.channel.send(this.IMAGE_ENDPOINT(user.id))
  }
}
