export type Mode = 'osu' | 'fruits' | 'mania' | 'taiko'

export interface Score {
  id: number
  user_id: number
  accuracy: number
  mods: string[]
  score: number
  max_combo: number
  passed: boolean
  perfect: boolean
  personalBestIndex?: number
  statistics: {
    count_50: number
    count_100: number
    count_300: number
    count_geki: number
    count_katu: number
    count_miss: number
  }
  rank: string
  created_at: string
  best_id: number
  pp: number
  mode: Mode
  mode_int: number
  replay: boolean
  beatmap: {
    beatmapset_id: number
    difficulty_rating: number
    id: number
    mode: Mode
    status: string
    total_length: number
    user_id: number
    version: string
    accuracy: number
    ar: number
    bpm: number
    convert: boolean
    count_circles: number
    count_sliders: number
    count_spinners: number
    cs: number
    deleted_at: null
    drain: number
    hit_length: number
    is_scoreable: boolean
    last_updated: string
    mode_int: number
    passcount: number
    playcount: number
    ranked: number
    url: string
    checksum: string
  }
  beatmapset: {
    artist: string
    artist_unicode: string
    covers: {
      cover: string
      card: string
      list: string
      slimcover: string
    }
    creator: string
    favourite_count: number
    hype: null
    id: number
    nsfw: boolean
    play_count: number
    preview_url: string
    source: string
    status: string
    title: string
    title_unicode: string
    user_id: number
    video: boolean
  }
  weight: { percentage: number; pp: number }
  user: {
    avatar_url: string
    country_code: string
    default_group: string
    id: number
    is_active: boolean
    is_bot: boolean
    is_deleted: boolean
    is_online: boolean
    is_supporter: boolean
    last_visit: string
    pm_friends_only: boolean
    profile_colour: null
    username: string
  }
}
