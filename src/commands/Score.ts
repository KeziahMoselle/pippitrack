import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import { RanksObject, UpdateRecordRow } from '../types/db'
import getEmoji from '../utils/getEmoji'
import getOsuAvatar from '../utils/getOsuAvatar'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

const intl = new Intl.NumberFormat('en-US')

export default class ScoreCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('score')
    .setDescription('Get differences in score/ranks')

  async run (interaction: CommandInteraction): Promise<void> {
    try {
      const username = interaction.options.getString('username')

      const user = await getUser({
        username,
        discordId: interaction.user.id
      })

      if (!user) {
        return interaction.reply({ embeds: [notFoundEmbed] })
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
        deltaRankedScore = user.scores.ranked - data.ranked_score
        deltaTotalScore = user.scores.total - data.total_score

        // Diff level
        deltaLevel = Number((user.level - data.level).toFixed(3))

        // Diff ranks
        const ranks: RanksObject = data.ranks as RanksObject

        deltaRanks = {
          SSH: user.counts.SSH - ranks.SSH,
          SS: user.counts.SS - ranks.SS,
          SH: user.counts.SH - ranks.SH,
          S: user.counts.S - ranks.S,
          A: user.counts.A - ranks.A
        }
      }

      let description = ''

      description += `**▸ Level:** ${user.level} ${deltaLevel ? `\`(+${deltaLevel})\`` : ''}\n`

      description += '**▸ Ranks:**'
      description += ` ${getEmoji('xh')} ${user.counts.SSH}`
      description += ` ${getEmoji('x')} ${user.counts.SS}`
      description += ` ${getEmoji('sh')} ${user.counts.SH}`
      description += ` ${getEmoji('s')} ${user.counts.S}`
      description += ` ${getEmoji('a')} ${user.counts.A}`

      description += '\n**▸ New ranks:**'
      description += ` ${getEmoji('xh')} \`${deltaRanks.SSH < 0 ? '' : '+'}${deltaRanks.SSH}\``
      description += ` ${getEmoji('x')} \`${deltaRanks.SS < 0 ? '' : '+'}${deltaRanks.SS}\``
      description += ` ${getEmoji('sh')} \`${deltaRanks.SH < 0 ? '' : '+'}${deltaRanks.SH}\``
      description += ` ${getEmoji('s')} \`${deltaRanks.S < 0 ? '' : '+'}${deltaRanks.S}\``
      description += ` ${getEmoji('a')} \`${deltaRanks.A < 0 ? '' : '+'}${deltaRanks.A}\``

      const embed = new MessageEmbed()
        .setTitle(`Changes since last update for ${user.name}'s scores`)
        .setThumbnail(getOsuAvatar(user.id))
        .setDescription(description)
        .addField('Ranked score', `${intl.format(user.scores.ranked)}\n${deltaRankedScore > 0 ? `\`(+${intl.format(deltaRankedScore)})\`` : ''}`, true)
        .addField('Total score', `${intl.format(user.scores.total)}\n${deltaRankedScore > 0 ? `\`(+${intl.format(deltaTotalScore)})\`` : ''}`, true)
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
          ranked_score: user.scores.ranked,
          total_score: user.scores.total,
          level: user.level,
          ranks: {
            SSH: user.counts.SSH,
            SS: user.counts.SS,
            SH: user.counts.SH,
            S: user.counts.S,
            A: user.counts.A
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
