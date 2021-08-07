import { Message } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import getUser from '../utils/getUser'
import notFoundEmbed from '../utils/notFoundEmbed'

export default class OsuProfileCommand implements BaseDiscordCommand {
  name = 'osu'
  arguments = ['username']
  description = 'Display your osu! profile (via osusig)'
  category = 'osu'

  IMAGE_ENDPOINT = (id: string | number): string =>
    `https://lemmmy.pw/osusig/sig.php?colour=pink&uname=${id}&pp=1&darktriangles&onlineindicator=undefined&xpbar&xpbarhex`

  async run (message: Message, args: string[]): Promise<Message> {
    const user = await getUser({ message, args })

    if (!user) {
      return message.channel.send({ embeds: [notFoundEmbed] })
    }

    return message.channel.send(this.IMAGE_ENDPOINT(user.id))
  }
}
