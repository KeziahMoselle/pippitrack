export interface UsersStateRow {
  osu_id: string
  last_updated: string
}

export interface TrackedUsersRow {
  id: number
  osu_id: string
  osu_username: string
  guild_id: string
  is_approved: boolean
}
