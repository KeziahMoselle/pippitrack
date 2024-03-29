/* eslint-disable no-unreachable-loop */
import axios from 'axios'
import supabase from '../../libs/supabase'

import { CronJob } from 'cron'
import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { osu } from '../../libs/osu'
import getOsuAvatar from '../../utils/getOsuAvatar'
import getEmoji from '../../utils/getEmoji'

const ENDPOINT = 'https://osu.ppy.sh/beatmapsets/search'

interface Beatmapset {
  'artist': string,
  'artist_unicode': string,
  'covers': {
    'cover': string,
    'cover@2x': string,
    'card': string,
    'card@2x': string,
    'list': string,
    'list@2x': string,
    'slimcover': string,
    'slimcover@2x': string
  },
  'creator': string,
  'favourite_count': number,
  'hype': boolean | null,
  'id': number,
  'nsfw': boolean,
  'play_count': number,
  'preview_url': string,
  'source': string,
  'status': string,
  'title': string,
  'title_unicode': string,
  'track_id': null | number,
  'user_id': number,
  'video': boolean,
  'availability': {
    'download_disabled': boolean,
    'more_information': null
  },
  'bpm': number,
  'can_be_hyped': boolean,
  'discussion_enabled': boolean,
  'discussion_locked': boolean,
  'is_scoreable': boolean,
  'last_updated': string,
  'legacy_thread_url': string,
  'nominations_summary': {
    'current': number,
    'required': number
  },
  'ranked': number,
  'ranked_date': string,
  'storyboard': boolean,
  'submitted_date': string,
  'tags': string,
  'beatmaps': {
    'beatmapset_id': number,
    'difficulty_rating': number,
    'id': number,
    'mode': 'osu' | 'taiko' | 'fruits' | 'mania',
    'status': 'loved' | 'ranked',
    'total_length': number,
    'user_id': number,
    'version': string,
    'accuracy': number,
    'ar': number,
    'bpm': number,
    'convert': false,
    'count_circles': number,
    'count_sliders': number,
    'count_spinners': number,
    'cs': number,
    'deleted_at': null,
    'drain': number,
    'hit_length': number,
    'is_scoreable': true,
    'last_updated': string,
    'mode_int': number,
    'passcount': number,
    'playcount': number,
    'ranked': number,
    'url': string,
    'checksum': string,
    'max_combo': number
  }[]
}

const EVERY_1_MINUTE = '*/1 * * * *'

export default function detectNewBeatmaps (client: Client): CronJob {
  console.log('Service started : detect new beatmaps')

  const job = new CronJob({
    cronTime: EVERY_1_MINUTE,
    onTick: newBeatmaps,
    timeZone: 'Europe/Paris',
    runOnInit: process.env.NODE_ENV === 'development'
  })

  const sentBeatmaps = new Set()
  const startTime = new Date()

  async function newBeatmaps () {
    try {
      const { data } = await axios.get(ENDPOINT, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.15.667.221 Safari/537.36',
          cookie: process.env.OSU_HEADER_COOKIE || ''
        }
      })

      const beatmapsets: Beatmapset[] = data.beatmapsets
      const newBeatmapsets: Beatmapset[] = []

      for (const beatmap of beatmapsets) {
        const isNewSinceStartup = new Date(beatmap.ranked_date) > startTime
        if (sentBeatmaps.has(beatmap.id)) continue

        if (isNewSinceStartup) {
          sentBeatmaps.add(beatmap.id)
          newBeatmapsets.push(beatmap)
        }
      }

      if (newBeatmapsets.length === 0) {
        return
      }

      const { data: guilds } = await supabase
        .from('guilds')
        .select('beatmaps_channel')
        .neq('beatmaps_channel', null)

      const channels = guilds.map(guild => guild.beatmaps_channel)

      for (const beatmap of newBeatmapsets) {
        const creator = await osu.getUser({
          u: beatmap.creator,
          type: 'string'
        })

        const unixTimestamp = Math.trunc(new Date(beatmap.ranked_date).getTime() / 1000)

        const embed = new MessageEmbed()
          .setTitle(`${beatmap.artist} - ${beatmap.title}`)
          .setURL(`https://osu.ppy.sh/beatmapsets/${beatmap.id}`)
          .setAuthor({
            name: `${beatmap.status === 'loved' ? '❤️ ' : ''}New ${beatmap.status} beatmap by ${beatmap.creator}`,
            iconURL: getOsuAvatar(creator.id)
          })
          .setImage(`https://assets.ppy.sh/beatmaps/${beatmap.id}/covers/cover.jpg`)

        if (beatmap.status === 'ranked') {
          embed.setColor('#b3ff66')
        }

        if (beatmap.status === 'loved') {
          embed.setColor('#ff66ab')
        }

        const sortedDiffs = beatmap.beatmaps.sort((a, b) => b.difficulty_rating - a.difficulty_rating)

        let diffDescription = ''

        // Additional info like length, circle counts..
        diffDescription += `${getEmoji('total_length')} Length \`${displayDuration(beatmap.beatmaps[0].total_length)}\``
        diffDescription += ` ${getEmoji('bpm')} BPM \`${beatmap.bpm}\`\n`
        diffDescription += `**Direct download**: [Beatconnect](https://beatconnect.io/b/${beatmap.id}) • [Nerina](https://nerina.pw/d/${beatmap.id})\n\n`

        for (const diff of sortedDiffs) {
          // Add mode icon if not default gamemode
          if (diff.mode !== 'osu') {
            diffDescription += `${getEmoji(diff.mode)}`
          }

          // Add each difficulty name
          diffDescription += `${getDiffEmoji(diff.difficulty_rating)} \`${diff.difficulty_rating}⭐\` - [${diff.version}](https://osu.ppy.sh/beatmapsets/${diff.beatmapset_id}#${diff.mode}/${diff.id})`

          // Only add AR and CS for osu gamemode
          if (diff.mode === 'osu' || diff.mode === 'fruits') {
            diffDescription += ` \`AR${diff.ar}\` \`CS${diff.cs}\``
          }

          if (diff.mode === 'mania' || diff.mode === 'taiko') {
            diffDescription += ` \`OD${diff.accuracy}\``
          }

          diffDescription += '\n'
        }

        diffDescription += `\n\n${beatmap.status.charAt(0).toUpperCase() + beatmap.status.slice(1)} <t:${unixTimestamp}:R>`

        embed.setDescription(diffDescription.trim())

        for (const chan of channels) {
          try {
            const channel = client.channels.cache.get(chan) as TextChannel
            channel.send({ embeds: [embed] })
          } catch (error) {
            console.error('Cannot get channel', chan)
          }
        }

        console.log(`New ${beatmap.status} beatmap sent to ${channels.length} channels: ${beatmap.artist} - ${beatmap.title} by ${beatmap.creator}`)
      }
    } catch (error) {
      console.error('newBeatmaps', error)
    }
  }

  return job
}

function getDiffEmoji (difficulty: number) {
  if (difficulty < 3) return getEmoji('diff_green')
  if (difficulty < 5) return getEmoji('diff_orange')
  if (difficulty < 8) return getEmoji('diff_blue')
  if (difficulty >= 8) return getEmoji('diff_black')
}

function displayDuration (seconds) {
  const format = val => `0${Math.floor(val)}`.slice(-2)
  const minutes = (seconds % 3600) / 60

  return [minutes, seconds % 60].map(format).join(':')
}
