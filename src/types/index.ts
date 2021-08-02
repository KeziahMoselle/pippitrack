import { Message, TextChannel } from 'discord.js'

export interface TrackedPlayer {
  guild_id: string
  id: number
  osu_id: string
  osu_username: string
  trackChannels?: TextChannel[]
  updatesChannels?: TextChannel[]
  replayChannels?: TextChannel[]
}

export interface TrackedPlayers {
  [key: string]: TrackedPlayer
}

export interface DBUser {
  osu_id: string
  id: number
  osu_username: string
  guild_id: string
  is_approved: boolean
}

export interface GetTrackedPlayersData {
  uniqueTrackedPlayers: TrackedPlayer[]
  count: number
}

export interface BaseDiscordCommand {
  name: string
  arguments: string[]
  description: string
  category: string

  run(...args): Promise<Message | Message[] | void>
}
