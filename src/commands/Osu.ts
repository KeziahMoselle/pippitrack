import {
  ApplicationCommandOption,
  CommandInteraction,
  Message
} from 'discord.js'
import { BaseDiscordCommand } from '../types'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

export default class OsuProfileCommand implements BaseDiscordCommand {
  name = 'osu'
  options: ApplicationCommandOption[] = [
    {
      name: 'user',
      description: 'Info about a user',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'target',
          description: 'The user',
          type: 'USER'
        }
      ]
    },
    {
      name: 'server',
      description: 'Info about the server',
      type: 'SUB_COMMAND'
    }
  ]

  arguments = ['username']
  description = 'Display your osu! profile (via osusig)'
  category = 'osu'

  IMAGE_ENDPOINT = (id: string | number): string =>
    `https://lemmmy.pw/osusig/sig.php?colour=pink&uname=${id}&pp=1&darktriangles&onlineindicator=undefined&xpbar&xpbarhex`

  async run (interaction: CommandInteraction): Promise<void> {
    const username = interaction.options.getString('username')
    const user = await getUser({ username })

    if (!user) {
      return interaction.reply({ embeds: [notFoundEmbed] })
    }

    return interaction.reply(this.IMAGE_ENDPOINT(user.id))
  }
}
