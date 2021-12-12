import { Message, MessageEmbed } from 'discord.js'
import { defaultPrefix } from '../config'
import prefixes from '../libs/prefixes'
import { BaseDiscordCommand } from '../types'
import { osu } from '../libs/osu'
import { group } from 'console'

export default class Test implements BaseDiscordCommand {
  name = 'mpstat'
  arguments = []
  description = 'Display a help message'
  category = 'general'

  async run (message: Message): Promise<Message> {
    const matchId = this.parseMatchId(message);
    let match = (await osu.getMatch({ mp: matchId }));
    const matchLength = this.getMatchLength(match.start, match.end);

    return message.channel.send(matchLength);


  }

  parseMatchId(message: Message) {
    const regex = /\/matches\/(?<matchId>\d*)/
    const str = 'https://osu.ppy.sh/community/matches/95147948'

    const { groups } = str.match(regex)
    return groups.matchId;
  }

  getMatchLength(startTime: Date, endTime: Date) {
    const start = { h: startTime.getHours(), m: startTime.getMinutes(), s: startTime.getSeconds() };
    const end = { h: endTime.getHours(), m: endTime.getMinutes(), s: endTime.getSeconds() };

    let hTotal = (end.h-start.h);
    let mTotal = (end.m-start.m);
    let sTotal = (end.s-start.s);
    const totalLength = {
       h: hTotal, 
       m: mTotal < 0 ? mTotal*-1 : mTotal, 
       s: sTotal < 0 ? sTotal*-1 : sTotal
    };

    let res = (totalLength.h < 10 ? "0" : "") + totalLength.h + "h"
            + totalLength.m + (totalLength.m === 1 ? "min" : "mins")
            + totalLength.s + "s";
    return res;
  }
}
