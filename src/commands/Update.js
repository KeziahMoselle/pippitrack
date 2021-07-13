const { MessageEmbed, User } = require('discord.js')
const supabase = require('../libs/supabase')
const { osu } = require('../libs/osu')
const getUser = require('../utils/getUser')
const getEmoji = require('../utils/getEmoji')
const axios = require('axios').default

class UpdateCommand {
  name = 'u'
  arguments = ['username']
  description = "See how much pp, rank, etc. you've gained since your last update"
  category = 'osu'

  UPDATE_ENDPOINT = (username) => `https://ameobea.me/osutrack/api/get_changes.php?mode=0&user=${username}`

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
   async run (message, args) {
    const user = await getUser({ message, args })

    const embed = new MessageEmbed()

    try {
      const { data: difference } = await axios.post(this.UPDATE_ENDPOINT(user.name))

      const { data } = await supabase
        .from('updates_timestamp')
        .select('updated_at')
        .eq('osu_id', user.id)
        .single()

      if (data?.updated_at) {
        embed
          .setFooter(`Last updated`)
          .setTimestamp(data.updated_at)
      } else {
        embed
          .setFooter(`First update !`)
          .setTimestamp()
      }


      // This player hasn't been tracked
      if (difference.first) {
        embed
          .setTitle(`${user.name} is now tracked on osu!track`)
          .setDescription('Play a bit and update again to see difference in stats since the last update.')
          .setURL(`https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`)

        return message.channel.send(embed)
      }

      embed
        .setTitle(`Changes since last update for ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .setURL(`https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`)

      const pp_rank_number = Number(difference.pp_rank)
      let pp_rank_diff

      const pp_raw = Number.parseFloat(difference.pp_raw).toPrecision(4)
      const accuracy = Number.parseFloat(difference.accuracy).toPrecision(4)

      // The player is losing ranks
      if (pp_rank_number > 0) {
        pp_rank_diff = Number(user.pp.rank) - Number(difference.pp_rank)
        embed
          .addField('Rank lost', `-${pp_rank_number}`, true)
          .setColor(14504273)
      }

      // The player is gaining ranks
      if (pp_rank_number < 0) {
        pp_rank_diff = Number(user.pp.rank) - pp_rank_number
        embed
          .addField('Rank gained', `+${pp_rank_number.toString().replace('-', '')}`, true)
          .setColor(2064687)
      }

      if (difference.playcount === 0 && !pp_rank_diff) {
        embed
          .setDescription(`No changes since the last update.\nTry getting some pp`)

        return message.channel.send(embed)
      }

      embed.addField('Playcount', `+${difference.playcount}`, true)

      if (pp_raw >= 1) {
        embed.addField('PP', `+${pp_raw}pp`, true)
      }

      if (pp_rank_diff) {
        embed.addField('Previous Rank', `#${pp_rank_diff}`, true)
        embed.addField('Current rank', `#${user.pp.rank}`, true)
      }

      if (accuracy >= 0.01) {
        embed.addField('Accuracy', `${accuracy}`, true)
      }

      if (difference.newhs.length > 0) {
        const newHighscores = difference.newhs.reduce((list, highscore) => {
          return list + `${getEmoji(highscore.rank.toLowerCase())} **${Math.round(highscore.pp)}pp** (Personal best #${highscore.ranking + 1})\n`
        }, '**New top plays :**\n')

        embed.setDescription(newHighscores)
      }

      return message.channel.send(embed)
    } catch (error) {
      console.error(error)
      return message.reply(`Sorry, there was an error.`)
    } finally {
      const { error } = await supabase
        .from('updates_timestamp')
        .upsert({
          osu_id: user.id,
          updated_at: new Date()
        })

      if (error) {
        console.error(error)
      }
    }
  }
}

module.exports = UpdateCommand