import { Message, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { osu } from '../libs/osu'
import { Game } from 'node-osu'
import { tools } from 'osu-api-extended'

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

    let formattedPlayerList = this.formatPlayerList(stats.playersList);

    const generalEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('MP Link Analyzed')
      .setURL(this.getMatchURL(message.content))
      .setDescription('Analyzed data for MP with ID: '+matchId)
      .addFields(
        { name: 'Duration', value: matchLength, inline:true },
        { name: 'Average SR', value: stats.averageStarRating.toPrecision(3), inline: true },
        { name: '\u200B', value: '\u200B' })
      .addFields(
        { name: 'Players', value: formattedPlayerList, inline: true },
        { name: 'Map played', value: this.formatMapPlayedCounterlist(stats.playersList), inline: true })
    
    const performanceEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle("Lobby's performance")
        .addFields(
          { name: 'Players', value: formattedPlayerList, inline: true },
          { name: 'Average Accuracy', value: this.formatAccuracyList(stats.averageAccuracyList), inline: true },
          { name: 'Consistency Rate', value: this.formatConsistencyRate(stats.averageConsistencyList), inline: true }
        )
    const mostPerformEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Most performant players')
        .addFields(
          { name: 'Best accuracy player', value: stats.bestAccuracyPlayer + " " + stats.bestAvgAccuracy+"%", inline:true },
          { name: 'Most consistent player', value: stats.mostConsistentPlayer + " with a " + stats.bestConsistencyRate + "% combo rate",  inline:true },
        )
    message.channel.send(generalEmbed);
    message.channel.send(performanceEmbed);
    return message.channel.send(mostPerformEmbed);


  }

  formatConsistencyRate(consistencyRates) {
    let res = "";
    for (const consistencyRate of consistencyRates) {
      res+=consistencyRate+"%\n";
    }
    return res;
  }

  formatAccuracyList(averageAccuracyList) {
    let res = "";
    for (const avgAcc of averageAccuracyList) {
      res+=avgAcc+"%\n";
    }
    return res;
  }

  formatPlayerList(playersList) {
    let res = "";
    for (const player of playersList) {
      res+=player['name']+"\n";
    }
    return res;
  } 

  formatMapPlayedCounterlist(playersList) {
    let res = "";
    for (const player of playersList) {
      res+=player['mapPlayedCounter']+"\n"
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
                  bestAvgAccuracy: 0,
                  averageConsistencyList: [], 
                  mostConsistentPlayer: "",
                  bestConsistencyRate: 0,
                  mostWellPlayedMap: "",
                  averageStarRating: 0,
                  playersList: []
                }
    let srList = [];
    let playersList = [];
    let mostWellPlayedMap = "";
    for (const game of games) {
      let beatmap = await osu.getBeatmaps({ b: game.beatmapId });
      
      srList.push(Number(beatmap[0].difficulty.rating));
      for (const multiplayerScore of game.scores) {
        let counts = multiplayerScore['counts'];
        await this.updatePlayerList(multiplayerScore['userId'], 
                                    playersList, 
                                    tools.accuracy(counts['300'], counts['100'], counts['50'], counts['miss'], counts['geki'], counts['katu'], "osu"),
                                    multiplayerScore['maxCombo'],
                                    beatmap[0].maxCombo
                                  ) 
      }
    }

    stats.averageStarRating = srList.reduce(((previousSR, currentSR) => previousSR + currentSR), 0)/games.length;

    let averageAccuracyInfo = this.retrieveAvgAccuracyInfo(playersList);
    let consistencyInfo = this.retrieveConsistencyInfo(playersList);

    stats.averageAccuracyList = averageAccuracyInfo.avgAccuracyList;
    stats.bestAccuracyPlayer = averageAccuracyInfo.bestAvgAccPlayer;
    stats.bestAvgAccuracy = averageAccuracyInfo.bestAvgAcc;

    stats.averageConsistencyList = consistencyInfo.avgConsistencyRatesList;
    stats.mostConsistentPlayer = consistencyInfo.mostConsistentPlayer;
    stats.bestConsistencyRate = consistencyInfo.bestConsistencyRate;

    stats.playersList = playersList;
    

    return stats;
  }

  retrieveConsistencyInfo(playersList: any[]) {
    let res = {
      avgConsistencyRatesList : [],
      mostConsistentPlayer: "",
      bestConsistencyRate: 0
    }

    for (const player of playersList) {
      let currentConsistencyRates = player['consistencyRates'];
      let avgConsistencyRate = player['consistencyRates'].reduce(((previousRate, currentRate) => previousRate + currentRate), 0)/currentConsistencyRates.length;
      avgConsistencyRate = Number(avgConsistencyRate.toPrecision(4));
      res['avgConsistencyRatesList'].push(avgConsistencyRate);
      if (avgConsistencyRate > res['bestConsistencyRate']) {
        res['bestConsistencyRate'] = avgConsistencyRate;
        res['mostConsistentPlayer'] = player['name']
      }
    }

    return res;
  }

  retrieveAvgAccuracyInfo(playersList: any[]) {
    let res = {
      bestAvgAccPlayer: "",
      bestAvgAcc: 0,
      avgAccuracyList: []
    }

    for (const player of playersList) {
      let currentAccList = player['accuracyList'];
      let avgAcc = player['accuracyList'].reduce(((previousAcc, currentAcc) => previousAcc + currentAcc), 0)/currentAccList.length;
      avgAcc = Number(avgAcc.toPrecision(4));
      res['avgAccuracyList'].push(avgAcc);

      if (avgAcc > res['bestAvgAcc']) {
        res['bestAvgAcc'] = avgAcc;
        res['bestAvgAccPlayer'] = player['name']
      }
    }

    return res;
  }

  async updatePlayerList(userId: Number, playersList: any[], accuracy: Number, playerCombo: Number, beatmapMaxCombo: Number) {
    let userIdString = userId.toString();
    let playerToUpdate;
    if (playersList.length == 0) {
      let user = await osu.getUser({ u: userIdString });
      playersList.push({
        id: userId,
        name: user.name,
        mapPlayedCounter: 0,
        accuracyList: [accuracy],
        consistencyRates: [(Number(playerCombo)/Number(beatmapMaxCombo))*100]
      });
    } else {
      let found = 0;
      for (const player of playersList) {
        if (player['id'] == userId) {
          found++;
          playerToUpdate = player;
        }
      }

      if (found === 0) {
        let user = await osu.getUser({ u: userIdString });
        playersList.push({
          id: userId,
          name: user.name,
          mapPlayedCounter: 0,
          accuracyList: [accuracy],
          consistencyRates: []
        });
      } else {
        playerToUpdate.accuracyList.push(accuracy);
        playerToUpdate.consistencyRates.push((Number(playerCombo)/Number(beatmapMaxCombo))*100);
        playerToUpdate.mapPlayedCounter = Number(playerToUpdate.mapPlayedCounter)+1;

      }
    }
  }
}
