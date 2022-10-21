import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { SlashCommandBuilder } from '@discordjs/builders'
import supabase from '../libs/supabase'
import { UpdateRecordRow } from '../types/db'
import { osuApiV2 } from '../libs/osu'
import getEmoji from '../utils/getEmoji'

export default class UpdateCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('update')
    .setDescription('See how much pp, rank, etc. you\'ve gained since your last update')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
    )
    .addStringOption((option) =>
      option.setName('mode')
        .setDescription('Game mode')
        .addChoice('Standard', 'osu')
        .addChoice('Catch The Beat', 'fruits')
        .addChoice('Taiko', 'taiko')
        .addChoice('Mania', 'mania')
    )
    .addIntegerOption((option) =>
      option.setName('index')
        .setDescription('Index, compare to an older update')
        .setMinValue(0)
        .setMaxValue(4))

  async run (interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply()
    const username = interaction.options.getString('username')
    const selectedMode = interaction.options.getString('mode')
    const rowIndex = interaction.options.getInteger('index') || 0

    try {
      const { user, mode, error } = await getUser({
        username,
        discordId: interaction.user.id,
        mode: selectedMode
      })

      const highscores = await osuApiV2.getUserBestScores({ id: user.id, mode })

      if (error) {
        const embed = new MessageEmbed()
          .setDescription(`Couldn't find \`${username}\`.\nTry with a different username or re link your account with \`/link\`.`)
          .setColor(14504273)

        interaction.editReply({ embeds: [embed] })
        return
      }

      // If a previous record has been found, do a difference between them
      const { data: previousDataRows, error: previousDataError } = await supabase
        .from<UpdateRecordRow>('updates_records')
        .select('*')
        .eq('osu_id', user.id)
        .eq('mode', mode)
        .eq('is_score_only', false)
        .limit(5)
        .order('id', {
          ascending: false
        })

      if (previousDataError) {
        console.error(error)
      }

      const previousData = previousDataRows?.[rowIndex]

      if (previousData) {
        const embed = new MessageEmbed()
        const level = Number(`${user.statistics.level.current}.${user.statistics.level.progress}`)
        const differenceRank = previousData.rank - user.statistics.global_rank
        const differenceCountryRank = previousData.country_rank - user.statistics.country_rank
        const differenceAccuracy = previousData.accuracy - user.statistics.hit_accuracy
        const differencePlaycount = previousData.playcount - user.statistics.play_count
        const differencePp = previousData.total_pp - user.statistics.pp
        const differenceLevel = previousData.level - level
        const unixTimestamp = Math.trunc(new Date(previousData.created_at).getTime() / 1000)
        const newTopPlays = highscores.filter((score) => new Date(score.created_at) > new Date(previousData.created_at))
        let hasChanges = false

        let description = ''

        const newhs = newTopPlays.splice(0, 10)
        let newHighscores = newhs.reduce((list, highscore, index) => {
          hasChanges = true
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

        if (differencePlaycount > 0) {
          hasChanges = true
          embed.addField('Playcount', `+${differencePlaycount}`, true)
        }

        if (Math.abs(differencePp) > 0) {
          hasChanges = true
          embed.addField('PP', `${differencePp > 0 ? '+' : ''}${Number(user.statistics.pp.toFixed(2))}pp`, true)
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

          embed.addField('Rank', `#${previousData.rank} -> #${user.statistics.global_rank} \`${differenceRank > 0 ? '+' : ''}${differenceRank}\``)
        }

        if (Math.abs(differenceCountryRank) > 0) {
          hasChanges = true
          embed.addField(`${getFlagEmoji(user.country_code)} Rank`, `#${previousData.country_rank} -> #${user.statistics.country_rank} \`(${differenceCountryRank > 0 ? '+' : ''}${differenceCountryRank})\``)
        }

        if (Math.abs(differenceAccuracy) > 0) {
          hasChanges = true
          embed.addField(
            'Accuracy',
            `${previousData.accuracy.toFixed(2)}% -> ${user.statistics.hit_accuracy.toFixed(2)}% \`${differenceAccuracy > 0 ? '+' : ''}${differenceAccuracy.toFixed(2)}%\``
          )
        }

        if (hasChanges) {
          embed
            .setTitle(`${getEmoji(mode)} Changes since last update for ${user.username}`)
            .setThumbnail(user.avatar_url)
            .setDescription(description)
        } else {
          embed.setDescription(`${getEmoji(mode)} No significant changes for ${user.username}`)
        }

        try {
          await interaction.editReply({
            content: `Last update <t:${unixTimestamp}:R>`,
            embeds: [embed]
          })

          const { error } = await supabase
            .from<UpdateRecordRow>('updates_records')
            .insert({
              osu_id: user.id.toString(),
              mode,
              playcount: user.statistics.play_count,
              rank: user.statistics.global_rank,
              country_rank: user.statistics.country_rank,
              accuracy: user.statistics.hit_accuracy,
              new_top_plays: [...newhs, ...newTopPlays],
              total_pp: user.statistics.pp,
              total_score: user.statistics.total_score,
              ranked_score: user.statistics.ranked_score,
              level,
              ranks: {
                SSH: user.statistics.grade_counts.ssh,
                SS: user.statistics.grade_counts.ss,
                SH: user.statistics.grade_counts.sh,
                S: user.statistics.grade_counts.s,
                A: user.statistics.grade_counts.a
              },
              difference_rank: differenceRank,
              difference_pp: differencePp,
              difference_accuracy: differenceAccuracy,
              difference_country_rank: differenceCountryRank,
              difference_level: differenceLevel,
              difference_playcount: differencePlaycount,
              is_score_only: false,
              created_at: new Date()
            })

          if (error) {
            console.error(error)
          }
        } catch (error) {
          console.error(error)
          interaction.editReply({
            content: 'An error occured.'
          })
        }
        return
      }

      // First update, save everything
      if (!previousData) {
        const level = Number(`${user.statistics.level.current}.${user.statistics.level.progress}`)

        const { error } = await supabase
          .from<UpdateRecordRow>('updates_records')
          .insert({
            osu_id: user.id.toString(),
            mode,
            playcount: user.statistics.play_count,
            rank: user.statistics.global_rank,
            country_rank: user.statistics.country_rank,
            accuracy: user.statistics.hit_accuracy,
            new_top_plays: highscores,
            total_pp: user.statistics.pp,
            total_score: user.statistics.total_score,
            ranked_score: user.statistics.ranked_score,
            level,
            ranks: {
              SSH: user.statistics.grade_counts.ssh,
              SS: user.statistics.grade_counts.ss,
              SH: user.statistics.grade_counts.sh,
              S: user.statistics.grade_counts.s,
              A: user.statistics.grade_counts.a
            },
            difference_rank: 0,
            difference_pp: 0,
            difference_accuracy: 0,
            difference_country_rank: 0,
            difference_level: 0,
            difference_playcount: 0,
            is_score_only: false,
            created_at: new Date()
          })

        if (error) {
          console.error(error)
        }

        const embed = new MessageEmbed()

        let description = ''

        const newhs = highscores.splice(0, 10)
        let newHighscores = newhs.reduce((list, highscore, index) => {
          return (
            list +
            `${getEmoji(highscore.rank)} **${Math.round(
              highscore.pp
            )}pp** (Personal best #${index + 1})\n`
          )
        }, `**New top play${highscores.length > 1 ? 's' : ''} :**\n`)

        if (highscores.length > 0) {
          newHighscores += `${highscores.length} more new top plays omitted. See them on [the osu! website](https://osu.ppy.sh/users/${user.id})`
        }

        description += newHighscores

        if (description) {
          embed.setDescription(description)
        }

        // This player hasn't been tracked
        embed
          .setTitle('First update!')
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

        interaction.editReply({
          embeds: [embed]
        })
      }
    } catch (error) {
      console.error(error)

      if (error.message === 'Cannot read property \'rank\' of undefined') {
        interaction.editReply({ embeds: [notFoundEmbed] })
      }

      interaction.editReply({
        content: error.message,
        ephemeral: true
      })
    }
  }
}

function getFlagEmoji (countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt())
  return String.fromCodePoint(...codePoints)
}
