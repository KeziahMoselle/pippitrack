import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import getEmoji from '../utils/getEmoji'
import getOsuAvatar from '../utils/getOsuAvatar'
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
    try {
      const username = interaction.options.getString('username')
      const mode = interaction.options.getString('mode') || 'osu'

      const user = await getUser({ username, mode })

      const embed = new MessageEmbed()
        .setTitle(`${interaction.user.username} has been set to ${user.name}`)
        .setThumbnail(getOsuAvatar(user.id))
        .addField('Rank', `#${user.pp.rank}`, true)
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
    } catch (error) {
      const embed = new MessageEmbed()
        .setTitle('Error')
        .setDescription(error.message)

      interaction.reply({ embeds: [embed] })
    }
  }
}
