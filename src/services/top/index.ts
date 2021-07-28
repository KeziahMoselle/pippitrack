import { CronJob } from 'cron'
import getTrackedPlayers from '../../utils/getTrackedPlayers'
import { Client, MessageEmbed } from 'discord.js'
import getNewTopPlays from './getNewTopPlays'
import { osuApiV2 } from '../../libs/osu'

const EVERY_3_HOURS = '0 0 */3 * * *'

export default function update (client: Client): CronJob {
  console.log('Service started : top plays')

  const job = new CronJob({
    cronTime: EVERY_3_HOURS,
    onTick: diffTopPlays,
    timeZone: 'Europe/Paris'
  })

  async function diffTopPlays () {
    const trackedPlayers = await getTrackedPlayers(client)

    for (const player of Object.values(trackedPlayers.uniqueTrackedPlayers)) {
      // Get the new top plays from a player
      const newPlays = await getNewTopPlays(player)

      // If there is new plays send them to the channel
      for (const play of newPlays) {
        const embed = new MessageEmbed()
          .setAuthor(
            `New #${play.personalBestIndex} for ${player.osu_username} in ${play.mode}!`,
            osuApiV2.getAvatarUrl(player.osu_id)
          )
          .setThumbnail(play.beatmapset.covers.list)
          .setDescription(
            `**[${play.beatmapset.title}](${play.beatmap.url})**\n` +
              ` [${play.beatmap.version}] (${play.beatmap.difficulty_rating} ⭐)` +
              ` +${play.mods.join('')}`
          )
          .addField('PP', `${Math.round(play.pp)}pp`, true)
          .addField('Accuracy', `${(play.accuracy * 100).toFixed(2)}%`, true)
          .setFooter('Score set')
          .setTimestamp(new Date(play.created_at))

        // Send the embed for each tracked channel linked to this player
        console.log('player', player)

        for (const channel of player.trackChannels) {
          console.log('channel', channel)
          channel.send(embed)
        }
      }
    }
  }

  return job
}
