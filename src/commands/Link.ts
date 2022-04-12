import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import getEmoji from '../utils/getEmoji'
import getUser from '../utils/getUser'

export default class LinkCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your osu! account to your Discord account')
    .addStringOption((option) =>
      option.setName('username')
        .setDescription('Your osu! username')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('mode')
        .setDescription('Game mode')
        .addChoice('Standard', 'osu')
        .addChoice('Catch The Beat', 'fruits')
        .addChoice('Taiko', 'taiko')
        .addChoice('Mania', 'mania')
    )

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')
    const mode = interaction.options.getString('mode') || 'osu'

    try {
      const { user, error: userError } = await getUser({ username, mode })

      if (userError) {
        const embed = new MessageEmbed()
          .setDescription(`Couldn't find \`${username}\`.\nTry with a different username or re link your account with \`/link\`.`)
          .setColor(14504273)

        interaction.editReply({ embeds: [embed] })
        return
      }

      const embed = new MessageEmbed()
        .setTitle(`${interaction.user.username} has been set to ${user.username}`)
        .setThumbnail(user.avatar_url)
        .addField('Rank', `#${user.statistics.global_rank}`, true)
        .addField('Mode', `${getEmoji(mode)} ${mode}`, true)
        .setColor(11279474)

      const { error } = await supabase
        .from('users')
        .upsert({
          discord_id: interaction.user.id,
          osu_id: user.id,
          mode
        })
        .eq('discord_id', interaction.user.id)

      if (error) {
        console.error(error)
        interaction.reply({
          content: error.message,
          ephemeral: true
        })
        return
      }

      interaction.reply({ embeds: [embed] })
      return
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Couldn't find ${username}`)
        .setColor(14504273)

      interaction.reply({ embeds: [embed] })
    }
  }
}
