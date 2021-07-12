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
      const response = await axios.post(this.UPDATE_ENDPOINT(user.id))

      const difference = response.data

      const embed = new MessageEmbed()
        .setTitle(`Changes since last update for ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Playcount', `+${difference.playcount}`, true)
        .addField('Rank', `${difference.pp_rank}`, true)
        .addField('PP', `${difference.pp_raw}`, true)
        .addField('Accuracy', `${difference.accuracy}`, true)
        .setURL(`https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`)
        .setColor(11279474)

      if (difference.newhs.length > 0) {
        const newHighscores = difference.newhs.reduce((list, highscore) => {
          return list + `**+${highscore.pp}** - ${highscore.rank} (#${highscore.ranking})\n`
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