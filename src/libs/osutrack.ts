import { MessageEmbed } from 'discord.js'
import axios from 'axios'
import supabase from '../libs/supabase'
import getUser from '../utils/getUser'
import getEmoji from '../utils/getEmoji'
import { User } from 'node-osu'

interface UpdateData {
  embed: MessageEmbed
  status: 'first' | 'no_change' | 'update'
}

class OsuTrack {
  baseUrl = 'https://ameobea.me/osutrack/api'

  async update (osuUser?: User, id?: string): Promise<UpdateData> {
    const user = osuUser || (await getUser({ id }))
    const embed = new MessageEmbed()

    try {
      const { data: difference } = await axios.post(
        `${this.baseUrl}/get_changes.php?mode=0&user=${user.name}`
      )

      const { data } = await supabase
        .from('updates_timestamp')
        .select('updated_at')
        .eq('osu_id', user.id)
        .single()

      if (data?.updated_at) {
        embed.setFooter('Last updated').setTimestamp(data.updated_at)
      } else {
        embed.setFooter('First update !').setTimestamp()
      }

      // This player hasn't been tracked
      if (difference.first) {
        embed
          .setTitle(`${user.name} is now tracked on osu!track`)
          .setDescription(
            'Play a bit and update again to see difference in stats since the last update.'
          )
          .setURL(
            `https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`
          )

        return {
          status: 'first',
          embed
        }
      }

      embed
        .setTitle(`Changes since last update for ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .setURL(
          `https://ameobea.me/osutrack/user/${encodeURIComponent(user.name)}`
        )

      let description = ''
      const ppRankNumber = Number(difference.pp_rank)
      let ppRankDiff

      const ppRaw = Number(Number.parseFloat(difference.pp_raw).toPrecision(4))
      const accuracy = Number(
        Number.parseFloat(difference.accuracy).toPrecision(4)
      )

      // The player is losing ranks
      if (ppRankNumber > 0) {
        ppRankDiff = Number(user.pp.rank) - ppRankNumber
        embed.addField('Rank lost', `-${ppRankNumber}`, true).setColor(14504273)
      }

      // The player is gaining ranks
      if (ppRankNumber < 0) {
        ppRankDiff = Number(user.pp.rank) - ppRankNumber
        embed
          .addField(
            'Rank gained',
            `+${ppRankNumber.toString().replace('-', '')}`,
            true
          )
          .setColor(2064687)
      }

      if (difference.playcount === 0 && !ppRankDiff) {
        embed.setDescription(
          'No changes since the last update.\nTry getting some pp'
        )

        return {
          status: 'no_change',
          embed
        }
      }

      if (difference.newhs.length > 0) {
        const newhs = difference.newhs.splice(0, 10)

        let newHighscores = newhs.reduce((list, highscore) => {
          return (
            list +
            `${getEmoji(highscore.rank)} **${Math.round(
              highscore.pp
            )}pp** (Personal best #${highscore.ranking + 1})\n`
          )
        }, `**New top play${newhs.length > 1 ? 's' : ''} :**\n`)

        if (difference.newhs.length > 0) {
          newHighscores += `${difference.newhs.length} more new top plays omitted. See them on [the osu! website](https://osu.ppy.sh/users/${user.id})`
        }

        description += newHighscores
      }

      embed.addField('Playcount', `+${difference.playcount}`, true)

      if (Math.abs(ppRaw) >= 0.1) {
        const currentNetPp = Number(user.pp.raw)
        const previousNetPp = currentNetPp - ppRaw

        embed.addField('PP', `${ppRaw > 0 ? '+' : ''}${ppRaw}pp`, true)
        description += `\n**Net pp:**\n${previousNetPp}pp 🠖 ${currentNetPp}pp`
      }

      if (ppRankDiff) {
        embed.addField('Previous Rank', `#${ppRankDiff}`, true)
        embed.addField('Current rank', `#${user.pp.rank}`, true)
      }

      if (Math.abs(accuracy) >= 0.01) {
        embed.addField(
          'Accuracy',
          `${accuracy > 0 ? '+' : ''}${accuracy.toFixed(2)}%`,
          true
        )
      }

      embed.setDescription(description)

      return {
        status: 'update',
        embed
      }
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      const { error } = await supabase.from('updates_timestamp').upsert({
        osu_id: user.id,
        updated_at: new Date()
      })

      if (error) {
        console.error(error)
      }
    }
  }
}

const osuTrack = new OsuTrack()

export default osuTrack
