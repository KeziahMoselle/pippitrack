import { CommandInteraction, MessageEmbed } from 'discord.js'
import { UpdateRecordRow } from '../types/db'
import { getUpdateEmbed } from '../utils/getUpdateEmbed'
import getUser from '../utils/getUser'
import { osuApiV2 } from './osu'
import supabase from './supabase'

type Type = 'first' | 'update' | 'no_change'

interface Update {
  embed: MessageEmbed
  type: Type
  previousData: UpdateRecordRow
}

export async function update ({
  username,
  id,
  selectedMode = 'osu',
  rowIndex = 0,
  interaction
}: {
  username?: string
  id?: string
  selectedMode: string
  rowIndex?: number
  interaction?: CommandInteraction
}): Promise<Update> {
  // Get previous update record
  const { user, mode, error } = await getUser({
    username,
    discordId: interaction?.user.id,
    mode: selectedMode,
    id
  })

  if (!user) {
    console.error('There was en error getting osu!profile with these parameters', {
      username,
      discordId: interaction?.user.id,
      selectedMode
    })
    throw new Error('Could not get osu! profile.')
  }

  const label = `update ${user.username}:${user.playmode}:${rowIndex}`
  console.time(label)

  try {
    const highscores = await osuApiV2.getUserBestScores({ id: user.id, mode })

    // Get previous record at index `rowIndex` if present
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
      const level = Number(`${user.statistics.level.current}.${user.statistics.level.progress}`)
      const differenceRank = previousData.rank - user.statistics.global_rank
      const differenceCountryRank = previousData.country_rank - user.statistics.country_rank
      const differenceAccuracy = user.statistics.hit_accuracy - previousData.accuracy
      const differencePlaycount = user.statistics.play_count - previousData.playcount
      const differencePp = user.statistics.pp - previousData.total_pp
      const differenceLevel = level - previousData.level
      const newTopPlays = highscores.reduce((acc, score, personalBestIndex) => {
        if (new Date(score.created_at) > new Date(previousData.created_at)) {
          acc.push({
            ...score,
            personalBestIndex
          })
        }

        return acc
      }, [])

      const { error } = await supabase
        .from<UpdateRecordRow>('updates_records')
        .insert({
          osu_id: user.id.toString(),
          mode,
          playcount: user.statistics.play_count,
          rank: user.statistics.global_rank,
          country_rank: user.statistics.country_rank,
          accuracy: user.statistics.hit_accuracy,
          new_top_plays: newTopPlays,
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
        return
      }

      const { embed, hasChanges } = getUpdateEmbed({
        user,
        newTopPlays,
        previousData,
        differenceAccuracy,
        differenceCountryRank,
        differencePlaycount,
        differencePp,
        differenceRank,
        mode
      })

      return {
        embed,
        type: !hasChanges ? 'no_change' : 'update',
        previousData
      }
    }

    // First update, save everything
    if (!previousData) {
      const level = Number(`${user.statistics.level.current}.${user.statistics.level.progress}`)

      const { embed } = getUpdateEmbed({
        user,
        newTopPlays: highscores,
        previousData,
        mode
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
        throw new Error(error.message)
      }

      return {
        embed,
        type: 'first',
        previousData
      }
    }
  } catch (error) {
    console.error(error)
    throw new Error(error.message)
  } finally {
    console.timeEnd(label)
  }
}
