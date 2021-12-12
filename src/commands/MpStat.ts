import { Message, MessageEmbed } from 'discord.js'
import { defaultPrefix } from '../config'
import prefixes from '../libs/prefixes'
import { BaseDiscordCommand } from '../types'
import osu from 'node-osu'

export default class MpStat implements BaseDiscordCommand {
  name = 'mpStat'
  arguments = []
  description = 'Display a help message'
  category = 'general'

  async run (message: Message): Promise<Message> {
    const osuApi = new osu.Api(process.env.OSU_API_KEY, {
        notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
        completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
        parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
    })

    const matchId = this.parseMatchId(message);
    
    return message.channel.send("oui")

  }

  parseMatchId(message: Message) {
    return message.content;
  }
}
