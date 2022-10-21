import { Score } from './osu'

export interface UsersRow {
  discord_id: string
  osu_id: string
  mode: 'osu' | 'fruits' | 'taiko' | 'mania'
}

export interface UsersStateRow {
  osu_id: string
  last_updated: string | Date
  total_score: number
  ranked_score: number
}

export interface TrackedUsersRow {
  id: number
  osu_id: string
  osu_mode: 'osu' | 'fruits' | 'taiko' | 'mania'
  osu_username: string
  guild_id: string
  is_approved: boolean
}

export interface GuildRow {
  guild_id: string
  track_channel: string
  updates_channel: string
  replay_channel: string
  admin_channel: string
  beatmaps_channel: string
  prefix: string
}

export type GuildColumns =
  | 'guild_id'
  | 'track_channel'
  | 'updates_channel'
  | 'replay_channel'
  | 'admin_channel'
  | 'beatmaps_channel'
  | 'prefix'

export interface RanksObject {
  SSH: number
  SS: number
  SH: number
  S: number
  A: number
}

export interface UpdateRecordRow {
  id: number
  osu_id: string
  difference_rank: number
  difference_pp: number
  difference_accuracy: number
  accuracy: number
  new_top_plays: Score[]
  playcount: number
  difference_playcount: number
  rank: number
  country_rank: number
  difference_country_rank: number
  total_pp: number
  ranked_score: number
  total_score: number
  level: number
  difference_level: number
  ranks: string | RanksObject
  is_score_only: boolean
  created_at: string | Date
  mode: string
}
