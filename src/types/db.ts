export interface UsersStateRow {
  osu_id: string
  last_updated: string | Date
  total_score: number
  ranked_score: number
}

export interface TrackedUsersRow {
  id: number
  osu_id: string
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
  new_top_plays: string
  playcount: number
  rank: number
  total_pp: number
  ranked_score: number
  total_score: number
  level: number
  ranks: string | RanksObject
  is_score_only: boolean
  created_at: string | Date
}
