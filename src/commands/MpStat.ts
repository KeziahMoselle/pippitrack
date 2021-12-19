import { Message, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { osu } from '../libs/osu'
import { Game } from 'node-osu'

export default class MpStat implements BaseDiscordCommand {
  name = 'mpstat'
  arguments = []
  description = 'Analyze and show useful information about an osu!multiplayer match'
  category = 'osu'

  async run (message: Message): Promise<Message> {
    const matchId = this.parseMatchId(message);
    let match = (await osu.getMatch({ mp: matchId }));

    const matchLength = this.getMatchLength(match.start, match.end);
    const stats = await this.getStatsFromGames(match.games);

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('MP Link Analyzed')
      .setURL(this.getMatchURL(message.content))
      .setDescription('Analyzed data for MP with ID: '+matchId)
      .addFields(
        { name: 'Duration', value: matchLength },
        { name: 'Players', value: this.formatPlayerList(stats), inline: true }
      )

    return message.channel.send(embed);


  }

  formatPlayerList(playersList) {
    let res = "";
    for (const player of playersList) {
      res+=player['name']+"\n";
    }
    return res;
  } 

  getMatchURL(content: string) : string {
    return content.split(" ")[1];
  }

  parseMatchId(message: Message) {
    const regex = /\/matches\/(?<matchId>\d*)/;
    const { groups } = message.content.match(regex);
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

  async getStatsFromGames(games: Game[]) {
    let stats = { averageAccuracyList: [],
                  bestAccuracyPlayer: "",
                  averageConsistencyList: [], 
                  mostConsistentPlayer: "",
                  mostWellPlayedMap: "",
                  FavouriteMod: "",
                  averageStarRating: 0,
                  nbMapsPlayedPerPlayer: []
                }
    let srList = new Array();
    let playersList = new Array();
    let mostWellPlayedMap = "";
    let modCounter = {NM: 0, HR: 0, DT: 0, HD: 0, EZ: 0};
    for (const game of games) {
      let beatmap = await osu.getBeatmaps({ b: game.beatmapId });
      srList.push(beatmap[0].difficulty.rating)
      for (const multiplayerScore of game.scores) {
        await this.updatePlayerList(multiplayerScore['userId'], playersList)
      }
    }
    return playersList;
  }

  async updatePlayerList(userId: Number, playersList: any[]) {
    let userIdString = userId.toString();
    if (playersList.length == 0) {
      let user = await osu.getUser({ u: userIdString });
      playersList.push({
        id: userId,
        name: user.name
      });
    } else {
      let found = 0;
      for (const player of playersList) {
        if (player['id'] == userId) {
          found++;
        }
      }

      if (found === 0) {
        let user = await osu.getUser({ u: userIdString });
        playersList.push({
          id: userId,
          name: user.name
        });
      }
    }
  }
}
