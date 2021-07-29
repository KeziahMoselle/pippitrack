import { CronJob } from 'cron'
import getTrackedPlayers from '../../utils/getTrackedPlayers'
import { Client, MessageEmbed } from 'discord.js'
import getNewTopPlays from './getNewTopPlays'
import getEmoji from '../../utils/getEmoji'
import { osuApiV2 } from '../../libs/osu'

const EVERY_30_MINUTES = '*/30 * * * *'

export default function update (client: Client): CronJob {
  console.log('Service started : top plays')

  const job = new CronJob({
    cronTime: EVERY_30_MINUTES,
    onTick: diffTopPlays,
    timeZone: 'Europe/Paris'
  })

  async function diffTopPlays () {
    console.time('diffTopPlays')

    const trackedPlayers = await getTrackedPlayers(client, 'track')

    console.log(
      `Top plays tracking service: ${trackedPlayers.uniqueTrackedPlayers.length} players to compare.`
    )

    for (const player of trackedPlayers.uniqueTrackedPlayers) {
      try {
        // Get the new top plays from a player
        const newPlays = await getNewTopPlays(player)

        if (newPlays.length === 0) {
          continue
        }

        // If there is new plays send them to the channel
        for (const play of newPlays) {
          const { max_combo } = await osuApiV2.getBeatmap({
            id: play.beatmap.id
          })

          let modsRow = '**NM**'
          if (play.mods.length > 0) {
            modsRow = `**${play.mods.length > 0 ? '+' : ''}${play.mods.join(
              ''
            )}**`
          }

          const embed = new MessageEmbed()
            .setAuthor(
              `New #${play.personalBestIndex} for ${player.osu_username} in ${play.mode}!`,
              play.user.avatar_url
            )
            .setThumbnail(play.beatmapset.covers.list)
            .setDescription(
              `**[${play.beatmapset.title}](${play.beatmap.url})** \`[${play.beatmap.version}]\`\n` +
                `${getEmoji(play.rank)} (${play.beatmap.difficulty_rating} ★)` +
                ` ${modsRow}\n` +
                `ᐅ x${play.max_combo}/${max_combo} ᐅ [${play.statistics.count_300}/${play.statistics.count_100}/${play.statistics.count_50}/${play.statistics.count_miss}]`
            )
            .addField('PP', `${Math.round(play.pp)}pp`, true)
            .addField('Accuracy', `${(play.accuracy * 100).toFixed(2)}%`, true)
            .setFooter('Score set')
            .setTimestamp(new Date(play.created_at))

          // Send the embed for each tracked channel linked to this player
          for (const channel of player.trackChannels) {
            try {
              await channel.send(embed)

              console.log(
                `Sent new top play from ${player.osu_username} to #${channel.name}`
              )
            } catch (error) {
              console.error('Top play send error : ', error)
            }
          }
        }
      } catch (error) {
        console.error('diffTopPlays error :', error)
      }
    }

    console.timeEnd('diffTopPlays')
  }

  return job
}
