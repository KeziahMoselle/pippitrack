import supabase from '../libs/supabase'

interface Guild {
  guild_id: string
  prefix: string
}

export default async function getPrefixes (): Promise<Guild[]> {
  const { data, error } = await supabase
    .from<Guild>('guilds')
    .select('guild_id, prefix')

  if (error) {
    throw error
  }

  if (data) {
    return data
  }
}
