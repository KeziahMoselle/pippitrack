import { MessageEmbed } from 'discord.js'
import { Score } from '../types/osu'
import getEmoji from './getEmoji'
import getFlagEmoji from './getFlagEmoji'

export function getUpdateEmbed ({
  user,
  mode,
  newTopPlays = [],
  previousData,
  differencePlaycount = 0,
  differencePp = 0,
  differenceRank = 0,
  differenceCountryRank = 0,
  differenceAccuracy = 0
}): {
  embed: MessageEmbed
  hasChanges: boolean
} {
  const embed = new MessageEmbed()
  let hasChanges = false

  // First update
  if (!previousData) {
    let description = ''

    const newhs = newTopPlays.splice(0, 10)
    let newHighscores = newhs.reduce((list, highscore, index) => {
      return (
        list +
        `${getEmoji(highscore.rank)} **${Math.round(
          highscore.pp
        )}pp** (Personal best #${index + 1})\n`
      )
    }, `**New top play${newTopPlays.length > 1 ? 's' : ''} :**\n`)

    if (newTopPlays.length > 0) {
      newHighscores += `${newTopPlays.length} more new top plays omitted. See them on [the osu! website](https://osu.ppy.sh/users/${user.id})`
    }

    description += newHighscores

    if (description) {
      embed.setDescription(description)
    }

    // This player hasn't been tracked
    embed
      .setTitle(`${getEmoji(mode)} First update!`)
      .setThumbnail(user.avatar_url)
      .setColor(6867286)
      .addField('Playcount', `+${user.statistics.play_count}`, true)
      .addField('PP', `+${Number(user.statistics.pp.toFixed(2))}pp`, true)
      .addField('Rank', `#${user.statistics.global_rank} (${getFlagEmoji(user.country_code)} #${user.statistics.country_rank})`, true)
      .addField(
        'Accuracy',
        `+${user.statistics.hit_accuracy.toFixed(2)}%`,
        true
      )
  } else { // Update
    hasChanges = true
    let description = ''
    const newhs = newTopPlays.splice(0, 10)
    let newHighscores = newhs.reduce((list, highscore: Score, index) => {
      hasChanges = true
      return (
        list +
        `${getEmoji(highscore.rank)} **${Math.round(
          highscore.pp
        )}pp** (Personal best [#${highscore.personalBestIndex + 1}](https://osu.ppy.sh/scores/${highscore.mode}/${highscore.id}))\n`
      )
    }, `**New top play${newhs.length > 1 ? 's' : ''} :**\n`)

    if (newTopPlays.length > 0) {
      newHighscores += `${newTopPlays.length} more new top plays omitted. See them on [the osu! website](https://osu.ppy.sh/users/${user.id})`
    }

    description += newHighscores

    if (differencePlaycount > 0) {
      hasChanges = true
      embed.addField('Playcount', `+${differencePlaycount}`, true)
    }

    if (Math.abs(differencePp) > 0) {
      hasChanges = true
      embed.addField('PP', `${(user.statistics.pp - differencePp).toFixed(2)}pp → ${user.statistics.pp.toFixed(2)}pp \`${differencePp > 0 ? '+' : ''}${differencePp.toFixed(2)}\``, true)
    }

    if (Math.abs(differenceRank) > 0) {
      hasChanges = true
      // User losing ranks
      if (differenceRank < 0) {
        embed.setColor(14504273)
      } else {
        // User gaining ranks
        embed.setColor(6867286)
      }

      embed.addField('Rank', `#${previousData.rank} → #${user.statistics.global_rank} \`${differenceRank > 0 ? '+' : ''}${differenceRank}\``)
    }

    if (Math.abs(differenceCountryRank) > 0) {
      hasChanges = true
      embed.addField(`${getFlagEmoji(user.country_code)} Rank`, `#${previousData.country_rank} → #${user.statistics.country_rank} \`(${differenceCountryRank > 0 ? '+' : ''}${differenceCountryRank})\``)
    }

    if (Math.abs(differenceAccuracy) > 0) {
      hasChanges = true
      embed.addField(
        'Accuracy',
        `${previousData.accuracy.toFixed(2)}% → ${user.statistics.hit_accuracy.toFixed(2)}% \`${differenceAccuracy > 0 ? '+' : ''}${differenceAccuracy.toFixed(3)}%\``
      )
    }

    if (hasChanges) {
      embed
        .setTitle(`${getEmoji(mode)} Changes since last update for ${user.username}`)
        .setThumbnail(user.avatar_url)
        .setDescription(description)
    } else {
      embed.setDescription(`${getEmoji(mode)} No significant changes for **${user.username}**`)
    }
  }

  return {
    embed,
    hasChanges
  }
}
