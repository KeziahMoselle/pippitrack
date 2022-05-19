import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import { RanksObject, UpdateRecordRow } from '../types/db'
import getEmoji from '../utils/getEmoji'
import getUser from '../utils/getUser'

const intl = new Intl.NumberFormat('en-US')

export default class ScoreCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('score')
    .setDescription('Get differences in score/ranks')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
    )

  async run (interaction: CommandInteraction): Promise<void> {
    try {
      const username = interaction.options.getString('username')

      const { user, error } = await getUser({
        username,
        discordId: interaction.user.id
      })

      if (error) {
        const embed = new MessageEmbed()
          .setDescription(`Couldn't find \`${username}\`.\nTry with a different username or re link your account with \`/link\`.`)
          .setColor(14504273)

        interaction.editReply({ embeds: [embed] })
        return
      }

      let hasData = true
      let deltaRankedScore = 0
      let deltaTotalScore = 0
      let deltaLevel = 0
      let deltaRanks: RanksObject = {
        SSH: 0,
        SS: 0,
        SH: 0,
        S: 0,
        A: 0
      }
      const level = Number(`${user.statistics.level.current}.${user.statistics.level.progress}`)

      const { data } = await supabase
        .from<UpdateRecordRow>('updates_records')
        .select('ranked_score, total_score, level, ranks, created_at')
        .order('id', {
          ascending: false
        })
        .limit(1)
        .eq('osu_id', user.id)
        .eq('is_score_only', true)
        .single()

      if (!data) {
        hasData = false
      }

      if (hasData) {
        // Diff score
        deltaRankedScore = user.statistics.ranked_score - data.ranked_score
        deltaTotalScore = user.statistics.total_score - data.total_score

        // Diff level
        deltaLevel = Number((level - data.level).toFixed(3))

        // Diff ranks
        const ranks: RanksObject = data.ranks as RanksObject

        deltaRanks = {
          SSH: user.statistics.grade_counts.ssh - ranks.SSH,
          SS: user.statistics.grade_counts.ss - ranks.SS,
          SH: user.statistics.grade_counts.sh - ranks.SH,
          S: user.statistics.grade_counts.s - ranks.S,
          A: user.statistics.grade_counts.a - ranks.A
        }
      }

      let description = ''

      description += `**▸ Level:** ${level} ${deltaLevel ? `\`(+${deltaLevel})\`` : ''}\n`

      description += '**▸ Ranks:**'
      description += ` ${getEmoji('xh')} ${user.statistics.grade_counts.ssh}`
      description += ` ${getEmoji('x')} ${user.statistics.grade_counts.ss}`
      description += ` ${getEmoji('sh')} ${user.statistics.grade_counts.sh}`
      description += ` ${getEmoji('s')} ${user.statistics.grade_counts.s}`
      description += ` ${getEmoji('a')} ${user.statistics.grade_counts.a}`

      description += '\n**▸ New ranks:**'
      description += ` ${getEmoji('xh')} \`${deltaRanks.SSH < 0 ? '' : '+'}${deltaRanks.SSH}\``
      description += ` ${getEmoji('x')} \`${deltaRanks.SS < 0 ? '' : '+'}${deltaRanks.SS}\``
      description += ` ${getEmoji('sh')} \`${deltaRanks.SH < 0 ? '' : '+'}${deltaRanks.SH}\``
      description += ` ${getEmoji('s')} \`${deltaRanks.S < 0 ? '' : '+'}${deltaRanks.S}\``
      description += ` ${getEmoji('a')} \`${deltaRanks.A < 0 ? '' : '+'}${deltaRanks.A}\``

      const embed = new MessageEmbed()
        .setTitle(`Changes since last update for ${user.username}'s scores`)
        .setThumbnail(user.avatar_url)
        .setDescription(description)
        .addField('Ranked score', `${intl.format(user.statistics.ranked_score)}\n${deltaRankedScore > 0 ? `\`(+${intl.format(deltaRankedScore)})\`` : ''}`, true)
        .addField('Total score', `${intl.format(user.statistics.total_score)}\n${deltaRankedScore > 0 ? `\`(+${intl.format(deltaTotalScore)})\`` : ''}`, true)
        .setColor(11279474)

      let messageEmbed = 'First update! Play a bit and type this command again to see your changes.'

      if (hasData) {
        const unixTimestamp = Math.trunc(new Date(data.created_at).getTime() / 1000)

        messageEmbed = `Last score update <t:${unixTimestamp}:R>`
      }

      interaction.reply({
        content: messageEmbed,
        embeds: [embed]
      })

      await supabase
        .from<UpdateRecordRow>('updates_records')
        .insert({
          osu_id: user.id.toString(),
          ranked_score: user.statistics.ranked_score,
          total_score: user.statistics.total_score,
          level,
          ranks: {
            SSH: user.statistics.grade_counts.ssh,
            SS: user.statistics.grade_counts.ss,
            SH: user.statistics.grade_counts.sh,
            S: user.statistics.grade_counts.s,
            A: user.statistics.grade_counts.a
          },
          is_score_only: true,
          created_at: new Date()
        })
    } catch (error) {
      console.error(`Score command error: ${error}`)
      const embed = new MessageEmbed()
        .setDescription(`Error: ${error}`)

      return interaction.reply({ embeds: [embed] })
    }
  }
}
