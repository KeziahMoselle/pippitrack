const { MessageEmbed, User } = require('discord.js')
const supabase = require('../libs/supabase')
const { osu } = require('../libs/osu')
const getUser = require('../utils/getUser')
const axios = require('axios').default

class UpdateCommand {
  name = 'u'
  arguments = ['username']
  description = 'Update osu!track profile.'
  category = 'osu'

  UPDATE_ENDPOINT = (id) => `https://osutrack-api.ameo.dev/update?user=${id}&mode=0`

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   * @memberof UpdateCommand
   */
   async run (message, args) {
    const user = await getUser({ message, args })

    try {
      const { data: difference } = await axios.post(this.UPDATE_ENDPOINT(user.id))

      // This player hasn't been tracked
      if (difference.first) {
        const embed = new MessageEmbed()
          .setTitle(`${user.name} is now tracked on osu!track`)
          .setDescription('Play a bit and update again to see difference in stats since the last update.')
          .setURL(`https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`)

        return message.channel.send(embed)
      }

      const pp_rank = difference.pp_rank > 0 ? `-${difference.pp_rank}` : `${difference.pp_rank}`.replace('-', '+')
      let pp_rank_diff

      // The player is losing ranks
      if (difference.pp_rank > 0) {
        pp_rank_diff = Number(user.pp.rank) + Number(difference.pp_rank)
      }

      // The player is gaining ranks
      if (difference.pp_rank < 0) {
        pp_rank_diff = Number(user.pp.rank) - Number(`${difference.pp_rank}`.replace('-', ''))
      }

      const pp_raw = Number.parseFloat(difference.pp_raw).toPrecision(4)
      const accuracy = Number.parseFloat(difference.accuracy).toPrecision(4)

      const embed = new MessageEmbed()
        .setTitle(`Changes since last update for ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .setURL(`https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`)
        .setColor(11279474)
        .addField('Rank gained', `${pp_rank}`, true)
        .addField('Playcount', `+${difference.playcount}`, true)

      if (pp_rank_diff) {
        embed.addField('Previous Rank', pp_rank_diff, true)
        embed.addField('Current rank', user.pp.rank, true)
      }

      if (pp_raw >= 1) {
        embed.addField('PP', `${pp_raw}`, true)
      }

      if (accuracy >= 0.01) {
        embed.addField('Accuracy', `${accuracy}`, true)
      }

      if (difference.newhs.length > 0) {
        const newHighscores = difference.newhs.reduce((list, highscore) => {
          return list + `:${highscore.rank}: **+${Math.round(highscore.pp)}pp** (Personal best #${highscore.ranking + 1})\n`
        }, 'New highscores :\n')

        embed.setDescription(newHighscores)
      }

      return message.channel.send(embed)
    } catch (error) {
      console.error(error)
      return message.reply('Sorry, there was an error.')
    }
  }
}

module.exports = UpdateCommand