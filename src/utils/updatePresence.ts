import supabase from '../libs/supabase'

const presences: Array<Function> = [
  getCountOfTrackedUsers,
  () => 'OwO',
  () => 'Bouf <3',
  () => 'UwU'
]

let presenceId = 0
const maxPresence = presences.length - 1

export default async function updatePresence (client) {
  const result = await presences[presenceId]()

  presenceId = presenceId + 1

  if (presenceId > maxPresence) {
    presenceId = 0
  }

  client.user.setPresence({
    activity: {
      name: `${result} | !help`,
      type: 'WATCHING'
    }
  })
}

async function getCountOfTrackedUsers () {
  const { count } = await supabase
    .from('tracked_users')
    .select('*', { count: 'exact' })

  return `${count} players`
}
