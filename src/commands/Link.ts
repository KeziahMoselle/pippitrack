import {
  ApplicationCommandOption,
  CommandInteraction,
  GuildMember,
  MessageEmbed
} from 'discord.js'
import supabase from '../libs/supabase'
import { BaseDiscordCommand } from '../types'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

export default class LinkCommand implements BaseDiscordCommand {
  name = 'link'
  options: ApplicationCommandOption[] = [
    {
      name: 'username',
      description: 'osu username',
      type: 'STRING',
      required: true
    }
  ]

  arguments = ['username']
  description = 'Link your Discord account to an osu! username'
  category = 'osu'

  async run (interaction: CommandInteraction, args: string[]): Promise<void> {
    try {
      const username = interaction.options.getString('username')
      const user = await getUser({ username, args })

      if (!user) {
        return interaction.reply({ embeds: [notFoundEmbed] })
      }

      const embed = new MessageEmbed()
        .setTitle(
          `${(interaction.member as GuildMember).displayName} has been set to ${
            user.name
          }`
        )
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      const { data: isDiscordUserPresent } = await supabase
        .from('users')
        .select('discord_id')
        .eq('discord_id', interaction.user.id)

      // If the Discord ID is present, update instead of insert
      if (isDiscordUserPresent.length > 0) {
        const { error } = await supabase
          .from('users')
          .update({ osu_id: user.id })
          .eq('discord_id', interaction.user.id)

        if (error) {
          console.error(error)
          return interaction.reply('Sorry, there was an error.')
        }

        return interaction.reply({ embeds: [embed] })
      }

      // Link the Discord ID to the osu id
      const { error } = await supabase.from('users').insert([
        {
          discord_id: interaction.user.id,
          osu_id: user.id
        }
      ])

      if (error) {
        console.error(error)
        return interaction.reply('Sorry, there was an error.')
      }

      interaction.reply({ embeds: [embed] })
    } catch {
      const embed = new MessageEmbed()
        .setTitle('Player not found')
        .setThumbnail('https://a.ppy.sh/')

      return interaction.reply({ embeds: [embed] })
    }
  }
}
