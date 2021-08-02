export interface UsersStateRow {
  osu_id: string
  last_updated: string | Date
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
  prefix: string
}

export type GuildColumns =
  | 'guild_id'
  | 'track_channel'
  | 'updates_channel'
  | 'replay_channel'
  | 'admin_channel'
  | 'prefix'
