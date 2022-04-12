import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import getModeInt from '../utils/getModeInt'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

export default class OsuProfileCommand implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('osu')
    .setDescription('Display your osu! profile (via osusig)')
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

  IMAGE_ENDPOINT = (id: string | number, mode = 'osu'): string =>
    `https://lemmmy.pw/osusig/sig.php?colour=pink&uname=${id}&pp=1&darktriangles&onlineindicator=undefined&xpbar&xpbarhex&mode=${getModeInt(mode)}`

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')
    const selectedMode = interaction.options.getString('mode')

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

    return interaction.reply(this.IMAGE_ENDPOINT(user.id, selectedMode || user.playmode))
  }
}
