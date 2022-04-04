import { CommandInteraction, MessageEmbed } from 'discord.js'
import { BaseDiscordCommand } from '../types'
import { osu } from '../libs/osu'
import { Game } from 'node-osu'
import { mods, tools } from 'osu-api-extended'
import { Embed, SlashCommandBuilder } from '@discordjs/builders'

export default class MpStat implements BaseDiscordCommand {
  data = new SlashCommandBuilder()
    .setName('multiplayer-stats')
    .setDescription('Analyze and show useful information about an osu!multiplayer match')
    .addStringOption(option =>
      option.setName('mp-link')
        .setDescription('The multiplayer match link, not needed if mp id is provided')
    )
    .addIntegerOption((option) =>
      option.setName('warmup')
        .setDescription('Number of maps player as warm up (to ignore)')
        .setMinValue(0)
    )
    .addIntegerOption((option) =>
      option.setName('id')
        .setDescription('id of the multiplayer match, not needed if mp-link is provided')
    )

  MP_REGEX = /\/matches\/(?<matchId>\d*)/

  async run (interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply()
    const mplink = interaction.options.getString('mp-link')
    const wu = interaction.options.getInteger('warmup') || 0
    const mpId = interaction.options.getInteger('id')

    if (mplink == null && mpId == null) {
      await interaction.editReply({
        content: 'You must at least provided either a multiplayer link or its id',
        embeds: []
      })
      return
    }

    const matchId = mpId == null ? this.parseMatchId(mplink) : mpId
    const match = (await osu.getMatch({ mp: matchId.toString() }))
    if (!match.games.length) {
      await interaction.editReply({
        content: "Match can't be found, you may have provided a wrong mp-link or ID",
        embeds: []
      })
    } else {
      const matchLength = this.getMatchLength(match.start, match.end)
      const stats = await this.getStatsFromGames(match.games, wu)
      const formattedPlayerList = this.formatPlayerList(stats.playersList)
      const mpStartDate = new Date(match.raw_start)
      const dateAccordingToTimezone = (mpStartDate.getTime() / 1000) + mpStartDate.getTimezoneOffset() * 60

      const generalEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Analysis result')
        .setURL(mplink)
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
          { name: 'Average SR', value: `${stats.avgSR} :star:`, inline: true },
          { name: 'Min SR', value: `${stats.minSR} :star:`, inline: true },
          { name: 'Max SR', value: `${stats.maxSR} :star:`, inline: true }
        )

      const BPMEmbed = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle('BPM :musical_note:')
        .addFields(
          { name: 'Average BPM', value: `${stats.avgBPM}`, inline: true },
          { name: 'Min BPM ', value: `${stats.minBPM}`, inline: true },
          { name: 'Max BPM', value: `${stats.maxBPM}`, inline: true }
        )

      const performanceEmbed = new MessageEmbed()
        .setColor('#f700ff')
        .setTitle("Lobby's performance (1)")
        .addFields(
          { name: 'Players', value: `${formattedPlayerList}`, inline: true },
          { name: 'Average Accuracy', value: `${this.formatPercentage(stats.averageAccuracyList)}`, inline: true },
          { name: 'Consistency Rate*', value: `${this.formatPercentage(stats.averageConsistencyList)}`, inline: true }
        )
        .setFooter({
          text: '* Consistency Rate is about how well you got combo on a map.\nThe value shown is the average of every consistency rates you got.'
        })

      const missEmbed = new MessageEmbed()
        .setColor('#f700ff')
        .setTitle("Lobby's performance (2)")
        .addFields(
          { name: 'Average misses during the lobby', value: `${stats.avgMissOverall}` },
          { name: 'Player', value: `${formattedPlayerList}`, inline: true },
          { name: 'Average misses', value: `${this.formatAvgMiss(stats.avgPlayersMiss)}`, inline: true }
        )

      const mostPerformEmbed = new MessageEmbed()
        .setColor('#9300ff')
        .setTitle('Most performant players')
        .addFields(
          { name: 'Best accuracy player', value: `**${stats.mostAccuratePlayer}** ${stats.bestAvgAccuracy}%`, inline: true },
          { name: 'Most consistent player', value: `**${stats.mostConsistentPlayer}** with a ${stats.bestConsistencyRate}% combo rate`, inline: true }
        )
      await interaction.editReply({
        content: 'MP analysis finished',
        embeds: [generalEmbed, SREmbed, BPMEmbed, performanceEmbed, missEmbed, mostPerformEmbed]
      })
    }
  }

  formatPercentage (percentageList) {
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

  formatAvgMiss (avgMissesList): string {
    let res = ''
    for (const avgMisses of avgMissesList) {
      res += avgMisses + '\n'
    }
    return res
  }

  parseMatchId (matchUrl: string) {
    try {
      const { groups } = matchUrl.match(this.MP_REGEX)
      return groups.matchId
    } catch {
      return null
    }
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

    const beatmapsFetches = games.map(game => osu.getBeatmaps({ b: game.beatmapId }))
    const beatmaps = (await Promise.all(beatmapsFetches))
      .map(beatmap => beatmap[0])
    for (const game of games.slice(warmUpCount)) {
      const beatmap = beatmaps.find(beatmap => beatmap ? beatmap.id === game.beatmapId : undefined)
      if (beatmap) {
        const gameMods = mods.name(game.raw_mods)

        if (gameMods.includes('DT')) {
          const beatmapWithMods = await osu.getBeatmaps({
            b: game.beatmapId,
            mods: mods.id('DT')
          })
          srList.push(Number(beatmapWithMods[0].difficulty.rating))
          bpmList.push(Number(beatmap.bpm) * 1.5)
        } else if (gameMods.includes('HT')) {
          const beatmapWithMods = await osu.getBeatmaps({
            b: game.beatmapId,
            mods: mods.id('HT')
          })
          srList.push(Number(beatmapWithMods[0].difficulty.rating))
          bpmList.push(Number(beatmap.bpm) * 0.5)
        } else if (gameMods.includes('HR')) {
          const beatmapWithMods = await osu.getBeatmaps({
            b: game.beatmapId,
            mods: mods.id('HR')
          })
          srList.push(Number(beatmapWithMods[0].difficulty.rating))
          bpmList.push(Number(beatmapWithMods[0].bpm))
        } else {
          srList.push(Number(beatmap.difficulty.rating))
          bpmList.push(Number(beatmap.bpm))
        }
        const playerFetches = game.scores.map(multiplayerScore => {
          // @ts-expect-error misstyped from the library.
          const counts = multiplayerScore.counts
          // @ts-expect-error misstyped from the library.
          return this.updatePlayerList(multiplayerScore.userId,
            playersList,
            tools.accuracy(counts['300'], counts['100'], counts['50'], counts.miss, counts.geki, counts.katu, 'osu'),
            // @ts-expect-error misstyped from the library.
            multiplayerScore.maxCombo,
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

  getMissInfos (playerList: any[]) {
    const missInfos = {
      avgOverallMisses: 0,
      avgPlayersMisses: []
    }

    playerList.forEach((player) => {
      const avgPlayerMiss = Math.floor(Number(this.getAvgFromList(player.misses)))
      missInfos.avgOverallMisses = Number(missInfos.avgOverallMisses) + Number(avgPlayerMiss)
      missInfos.avgPlayersMisses.push(avgPlayerMiss)
    })

    missInfos.avgOverallMisses = Number((Number(missInfos.avgOverallMisses) / Number(playerList.length)))
    missInfos.avgOverallMisses = Math.floor(missInfos.avgOverallMisses)
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
