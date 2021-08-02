import { MessageEmbed } from 'discord.js'
import getEmoji from '../../utils/getEmoji'
import { osuApiV2 } from '../../libs/osu'
import { Score } from '../../types/osu'
import { TrackedPlayer } from '../../types'

export default async function getEmbed ({
  play,
  player
}: {
  play: Score
  player: TrackedPlayer
}): Promise<MessageEmbed> {
  const { max_combo } = await osuApiV2.getBeatmap({
    id: play.beatmap.id
  })

  let modsRow = '**NM**'
  if (play.mods.length > 0) {
    modsRow = `**${play.mods.length > 0 ? '+' : ''}${play.mods.join('')}**`
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

  return embed
}
