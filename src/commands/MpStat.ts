import { Message, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { osu } from '../libs/osu'
import { Game } from 'node-osu'
import { mods, tools } from 'osu-api-extended'

export default class MpStat implements BaseDiscordCommand {
  name = 'mpstat'
  arguments = ['wu']
  description = 'Analyze and show useful information about an osu!multiplayer match'
  category = 'osu'

  MP_REGEX = /\/matches\/(?<matchId>\d*)/

  async run (message: Message, args?: string[], flags?): Promise<Message> {
    let flagsToProceed
    if (flags) {
      flagsToProceed = this.checkingFlags(Object.keys(flags))
    }
    let res
    if (flagsToProceed) {
      res = this.areFlagsExecutable(flags, flagsToProceed)
      if (res.error) {
        return message.channel.send(res.error)
      }
    }
    const matchId = this.parseMatchId(message)
    const match = (await osu.getMatch({ mp: matchId }))

    const matchLength = this.getMatchLength(match.start, match.end)
    const stats = await this.getStatsFromGames(match.games, res ? res.wu : 0)
    const formattedPlayerList = this.formatPlayerList(stats.playersList)
    const mpStartDate = new Date(match.raw_start)
    const dateAccordingToTimezone = (mpStartDate.getTime() / 1000) + mpStartDate.getTimezoneOffset() * 60

    const generalEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('MP Link Analyzed')
      .setURL(this.getMatchURL(message.content))
      .setDescription('Match played <t:' + dateAccordingToTimezone.toString() + ':R>')
      .addField('Duration', matchLength, false)
    if (stats.deletedMaps > 0) {
      generalEmbed.addField('Disclaimer', stats.deletedMaps + (stats.deletedMaps === 1 ? ' map has' : ' maps have') + ' been deleted since the multiplayer lobby and therefore not counted', false)
    }
    generalEmbed.addFields(
      { name: 'Players', value: formattedPlayerList, inline: true },
      { name: 'Map played', value: this.formatMapPlayedCounterlist(stats.playersList), inline: true }
    )
    const SREmbed = new MessageEmbed()
      .setColor('#33ff3f')
      .setTitle('Star Rating')
      .addFields(
        { name: 'Average SR', value: stats.avgSR + ' :star:', inline: true },
        { name: 'Min SR', value: stats.minSR + ' :star:', inline: true },
        { name: 'Max SR', value: stats.maxSR + ' :star:', inline: true }
      )

    const BPMEmbed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle('BPM :musical_note:')
      .addFields(
        { name: 'Average BPM', value: stats.avgBPM, inline: true },
        { name: 'Min BPM ', value: stats.minBPM, inline: true },
        { name: 'Max BPM', value: stats.maxBPM, inline: true }
      )

    const performanceEmbed = new MessageEmbed()
      .setColor('#f700ff')
      .setTitle("Lobby's performance (1)")
      .addFields(
        { name: 'Players', value: formattedPlayerList, inline: true },
        { name: 'Average Accuracy', value: this.formatPercentage(stats.averageAccuracyList), inline: true },
        { name: 'Consistency Rate*', value: this.formatPercentage(stats.averageConsistencyList), inline: true }
      )
      .setFooter('* Consistency Rate is about how well you got combo on a map.\nThe value shown is the average of every consistency rates you got.\n')
    
    const missEmbed = new MessageEmbed()
      .setColor('#f700ff')
      .setTitle("Lobby's performance (2)")
      .addFields(
        { name: 'Average misses during the lobby', value: stats.avgMissOverall },
        { name: 'Player', value: formattedPlayerList, inline: true },
        { name: 'Average misses', value: this.formatAvgMiss(stats.avgPlayersMiss), inline: true }
      )

    const mostPerformEmbed = new MessageEmbed()
      .setColor('#9300ff')
      .setTitle('Most performant players')
      .addFields(
        { name: 'Best accuracy player', value: '**' + stats.mostAccuratePlayer + '** ' + stats.bestAvgAccuracy + '%', inline: true },
        { name: 'Most consistent player', value: '**' + stats.mostConsistentPlayer + '** with a ' + stats.bestConsistencyRate + '% combo rate', inline: true }
      )
    await message.channel.send(generalEmbed)
    await message.channel.send(SREmbed)
    await message.channel.send(BPMEmbed)
    await message.channel.send(performanceEmbed)
    await message.channel.send(missEmbed)
    return message.channel.send(mostPerformEmbed)
  }

  checkingFlags (flags : any[]) : string[] {
    const flagsToProceed = []
    flags.forEach(flag => {
      const flagToProceed = this.arguments.find(argument => argument === flag)
      if (flagToProceed) {
        flagsToProceed.push(flagToProceed)
      }
    })
    return flagsToProceed
  }

  areFlagsExecutable (flags, flagsToProceed: string[]) {
    const res = {
      error: '',
      wu: 0
    }
    flagsToProceed.forEach(flagToProceed => {
      switch (flagToProceed) {
        case 'wu':
          if (isNaN(parseInt(flags[flagToProceed]))) {
            res.error = '-wu : Warm-Up count must be a number'
          } else {
            res[flagToProceed] = parseInt(flags[flagToProceed])
          }
          break
        default:
      }
    })
    return res
  }

  formatPercentage(percentageList) {
    let res = ''
    for (const percentage of percentageList) {
      res += percentage + '%\n'
    }
    return res
  }

  formatPlayerList (playersList): string {
    let res = ''
    for (const player of playersList) {
      res += '**' + player.name + '**\n'
    }
    return res
  }

  formatMapPlayedCounterlist (playersList): string {
    let res = ''
    for (const player of playersList) {
      res += player.mapPlayedCounter + '\n'
    }
    return res
  }

  formatAvgMiss(avgMissesList): string {
    let res = ''
    for (const avgMisses of avgMissesList) {
      res += avgMisses + '\n'
    }
    return res
  }

  getMatchURL (content: string) : string {
    return content.split(' ')[1]
  }

  parseMatchId (message: Message) {
    const { groups } = message.content.match(this.MP_REGEX)
    return groups.matchId
  }

  getMatchLength (startTime: Date, endTime: Date) {
    const ms = endTime.getTime() - startTime.getTime()
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms / 3600000 - h) * 60)
    const s = Math.floor((((ms / 3600000 - h) * 60) - m) * 60)
    const res = (h < 10 ? '0' + h : h) + 'h' + (m < 10 ? '0' + m : m) + (m < 1 ? 'min' : 'mins') + (s < 10 ? '0' + s : s) + 's'
    return res
  }

  async getStatsFromGames (games: Game[], warmUpCount: number) {
    const stats = {
      averageAccuracyList: [],
      mostAccuratePlayer: '',
      bestAvgAccuracy: 0,
      averageConsistencyList: [],
      mostConsistentPlayer: '',
      bestConsistencyRate: 0,
      mostWellPlayedMap: '',
      playersList: [],
      avgPlayersMiss: [],
      avgMissOverall: 0,
      avgSR: 0,
      minSR: 0,
      maxSR: 0,
      avgBPM: 0,
      minBPM: 0,
      maxBPM: 0,
      deletedMaps: 0
    }
    const srList = []
    const bpmList = []
    const playersList = []
    const modCount = {}
    const mostWellPlayedMap = ''

    const beatmapsFetches = games.map(game => osu.getBeatmaps({ b: game.beatmapId }))
    const beatmaps = (await Promise.all(beatmapsFetches))
      .map(beatmap => beatmap[0])
    for (const game of games.slice(warmUpCount)) {
      const beatmap = beatmaps.find(beatmap => beatmap ? beatmap.id === game.beatmapId : undefined)
      if (beatmap) {
        srList.push(Number(beatmap.difficulty.rating))
        bpmList.push(Number(beatmap.bpm))

        const playerFetches = game.scores.map(multiplayerScore => {
          const counts = multiplayerScore['counts']
          return this.updatePlayerList(multiplayerScore['userId'],
            playersList,
            tools.accuracy(counts['300'], counts['100'], counts['50'], counts.miss, counts.geki, counts.katu, 'osu'),
            multiplayerScore['maxCombo'],
            beatmap.maxCombo,
            counts.miss
          )
        })
        await Promise.all(playerFetches)
      } else {
        stats.deletedMaps++
      }
    }
    const averageAccuracyInfo = this.getBestAndAllPercentageFrom(playersList, 'accuracy')
    const consistencyInfo = this.getBestAndAllPercentageFrom(playersList, 'consistency')

    stats.averageAccuracyList = averageAccuracyInfo.avgList
    stats.mostAccuratePlayer = averageAccuracyInfo.most
    stats.bestAvgAccuracy = averageAccuracyInfo.best

    stats.averageConsistencyList = consistencyInfo.avgList
    stats.mostConsistentPlayer = consistencyInfo.most
    stats.bestConsistencyRate = consistencyInfo.best

    const missInfos = this.getMissInfos(playersList)
    stats.avgMissOverall = missInfos.avgOverallMisses
    stats.avgPlayersMiss = missInfos.avgPlayersMisses

    const BPMInfo = this.getBasicStatsInfos(bpmList)
    stats.avgBPM = Number(BPMInfo.avg.toFixed(2))
    stats.minBPM = BPMInfo.min
    stats.maxBPM = BPMInfo.max

    const SRInfo = this.getBasicStatsInfos(srList)
    stats.avgSR = Number(SRInfo.avg.toPrecision(3))
    stats.maxSR = Number(SRInfo.max.toPrecision(3))
    stats.minSR = Number(SRInfo.min.toPrecision(3))

    stats.playersList = playersList

    return stats
  }

  getBasicStatsInfos (infos: any[]) {
    const res = {
      avg: 0,
      max: 0,
      min: 0
    }

    res.max = infos.reduce((previous, current) => { return previous > current ? previous : current })
    res.min = infos.reduce((previous, current) => { return previous < current ? previous : current })
    res.avg = this.getAvgFromList(infos)
    return res
  }

  getBestAndAllPercentageFrom (playersList: any[], statToTakeCare: string) {
    const res = {
      avgList: [],
      most: '',
      best: 0
    }

    for (const player of playersList) {
      let currentList
      let avg
      switch (statToTakeCare) {
        case 'consistency':
          currentList = player.consistencyRates
          break
        case 'accuracy':
          currentList = player.accuracyList
          break
        default:
      }
      avg = this.getAvgFromList(currentList)
      avg = Number(avg.toPrecision(4))
      res.avgList.push(avg)

      if (avg > res.best) {
        res.best = avg
        res.most = player.name
      }
    }

    return res
  }

  getMissInfos(playerList: any[]) {
    const missInfos = {
      avgOverallMisses: 0,
      avgPlayersMisses: []
    }

    playerList.forEach((player) => {
      const avgPlayerMiss = Number(this.getAvgFromList(player.misses).toFixed(2))
      missInfos.avgOverallMisses = Number(missInfos.avgOverallMisses) + Number(avgPlayerMiss)
      missInfos.avgPlayersMisses.push(avgPlayerMiss)
    })

    missInfos.avgOverallMisses = Number((Number(missInfos.avgOverallMisses) / Number(playerList.length)).toFixed(2))

    return missInfos
  }

  getAvgFromList (list: any[]) {
    return list.reduce((prev, cur) => Number(prev) + Number(cur), 0) / list.length
  }

  async updatePlayerList (userId: number, playersList: any[], accuracy: number, playerCombo: number, beatmapMaxCombo: number, missOnTheMap: number) {
    const playerToUpdate = playersList.find(player => player.id === userId)
    if (!playerToUpdate) {
      const user = await osu.getUser({ u: userId.toString() })
      playersList.push({
        id: userId,
        name: user.name,
        mapPlayedCounter: 1,
        accuracyList: [accuracy],
        consistencyRates: [(Number(playerCombo) / Number(beatmapMaxCombo)) * 100],
        misses: [missOnTheMap]
      })
    } else {
      playerToUpdate.accuracyList.push(accuracy)
      playerToUpdate.misses.push(missOnTheMap)
      playerToUpdate.consistencyRates.push((Number(playerCombo) / Number(beatmapMaxCombo)) * 100)
      playerToUpdate.mapPlayedCounter = Number(playerToUpdate.mapPlayedCounter) + 1
    }
  }
}
