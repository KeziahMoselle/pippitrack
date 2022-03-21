import { MessageEmbed } from 'discord.js'
import axios from 'axios'
import supabase from '../libs/supabase'
import getEmoji from '../utils/getEmoji'
import { User } from '../types/osu'
import { osuApiV2 } from './osu'
import getModeInt from '../utils/getModeInt'

interface UpdateData {
  embed: MessageEmbed
  status: 'first' | 'no_change' | 'update'
  embedMessage: string
}

class OsuTrack {
  baseUrl = 'https://ameobea.me/osutrack/api'

  async update ({
    osuUser,
    id,
    mode = 'osu'
  }: {
    osuUser?: User,
    id?: string
    mode?: string
  }): Promise<UpdateData> {
    const user = osuUser || (await osuApiV2.getUser({ id }))
    const embed = new MessageEmbed()

    if (!user.statistics.pp) {
      return
    }

    try {
      const modeInt = getModeInt(mode)

      const { data: difference } = await axios.post(
        `${this.baseUrl}/get_changes.php?mode=${modeInt}&user=${user.username}`
      )

      const { data } = await supabase
        .from('updates_timestamp')
        .select('updated_at')
        .eq('osu_id', user.id)
        .single()

      let embedMessage = ''

      if (data?.updated_at) {
        const unixTimestamp = Math.trunc(new Date(data?.updated_at).getTime() / 1000)
        embedMessage = `Last update <t:${unixTimestamp}:R>`
      } else {
        embedMessage = 'First update!'
      }

      // This player hasn't been tracked
      if (difference.first) {
        embed
          .setTitle(`${user.username} has been added on osu!track!`)
          .setDescription(
            'Play a bit and update again to see difference in stats since the last update.'
          )
          .setURL(
            `https://ameobea.me/osutrack/user/${encodeURIComponent(user.username)}`
          )

        return {
          status: 'first',
          embed,
          embedMessage
        }
      }

      embed
        .setTitle(`${getEmoji(mode)} Changes since last update for ${user.username}`)
        .setThumbnail(user.avatar_url)
        .setURL(
          `https://ameobea.me/osutrack/user/${encodeURIComponent(user.username)}`
        )

      let description = ''
      const ppRankNumber = Number(difference.pp_rank)
      let ppRankDiff

      const ppRaw = Number(Number.parseFloat(difference.pp_raw).toFixed(4))
      const accuracy = Number(Number.parseFloat(difference.accuracy).toFixed(4))

      // The player is losing ranks
      if (ppRankNumber > 0) {
        ppRankDiff = Number(user.statistics.rank) - ppRankNumber
        embed.addField('Rank lost', `-${ppRankNumber}`, true).setColor(14504273)
      }

      // The player is gaining ranks
      if (ppRankNumber < 0) {
        ppRankDiff = Number(user.statistics.rank) - ppRankNumber
        embed
          .addField(
            'Rank gained',
          `+${ppRankNumber.toString().replace('-', '')}`,
          true
          )
          .setColor(6867286)
      }

      console.log(ppRankDiff)

      if (difference.playcount === 0 && !ppRankDiff) {
        embed.setDescription(
          'No changes since the last update.\nTry getting some pp'
        )

        return {
          status: 'no_change',
          embed,
          embedMessage
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
        const currentNetPp = Number(Number(user.statistics.pp).toFixed(2))
        const previousNetPp = (currentNetPp - ppRaw).toFixed(2)

        embed.addField('PP', `${ppRaw > 0 ? '+' : ''}${ppRaw}pp`, true)
        description += `\n**Net pp:**\n${previousNetPp}pp → ${currentNetPp}pp`
      }

      if (ppRankDiff) {
        embed.addField('Previous Rank', `#${ppRankDiff}`, true)
        embed.addField('Current rank', `#${user.statistics.global_rank}`, true)
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
        embed,
        embedMessage
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
