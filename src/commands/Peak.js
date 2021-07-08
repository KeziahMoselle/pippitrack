const { MessageEmbed, User } = require('discord.js')
const { osu } = require('../libs/osu')
const axios = require('axios').default

class PeakCommand {
  name = 'peak'
  arguments = ['username']
  description = 'Display peak rank and peak accuracy of a player'
  category = 'osu'

  PEAK_ENDPOINT = `https://osutrack-api.ameo.dev/peak`

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   * @memberof PeakCommand
   */
   async run (message, args) {
    // Allow username with whitespaces
    const username = args.join(' ')

    try {
      const user = await osu.getUser({
        u: username
      })

      const response = await axios.get(this.PEAK_ENDPOINT, {
        params: {
          user: user.id,
          mode: 0
        }
      })

      const peak = response.data[0]
      const rank = peak.best_global_rank
      const bestAccuracy = peak.best_accuracy.toPrecision(4)

      const embed = new MessageEmbed()
        .setTitle(`Peak stats for : ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Max rank', `#${rank}`, true)
        .addField('Best accuracy', `${bestAccuracy}%`, true)
        .setFooter('These data may be incorrect if the profile has not yet been tracked on https://ameobea.me/osutrack/')
        .setURL(`https://ameobea.me/osutrack/user/${user.name}`)
        .setColor(11279474)

      return message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${username}`)
        .setDescription(`
          https://osu.ppy.sh/users/${username}
          https://ameobea.me/osutrack/user/${username}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}

module.exports = PeakCommand