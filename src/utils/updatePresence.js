const supabase = require('../libs/supabase')


const presences = [
  getCountOfTrackedUsers,
  'OwO',
  'Bouf <3',
  'UwU',
]

let presenceId = 0
const maxPresence = presences.length - 1

async function updatePresence(client) {
  let result

  if (typeof presences[presenceId] === 'function') {
    result = await presences[presenceId]()
  } else {
    result = presences[presenceId]
  }

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

async function getCountOfTrackedUsers() {
  const { count } = await supabase
    .from('tracked_users')
    .select('*', { count: 'exact' })

  return `${count} players`
}

module.exports = updatePresence