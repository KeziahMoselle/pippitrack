import { Client } from 'discord.js'
import supabase from '../libs/supabase'

interface Presences {
  (): Promise<string> | string
}

const presences: Presences[] = [
  getCountOfTrackedUsers,
  () => 'OwO',
  () => 'Bouf <3',
  () => 'UwU',
  () => '>w<'
]

let presenceId = 0
const maxPresence = presences.length - 1

export default async function updatePresence (client: Client): Promise<void> {
  const result = await presences[presenceId]()

  presenceId = presenceId + 1

  if (presenceId > maxPresence) {
    presenceId = 0
  }

  client.user.setPresence({
    activities: [{
      name: `${result} | !help`,
      type: 'WATCHING'
    }]
  })
}

async function getCountOfTrackedUsers () {
  const { count } = await supabase
    .from('tracked_users')
    .select('*', { count: 'exact' })

  return `${count} players`
}
