const { CronJob } = require('cron')
const supabase = require('../../libs/supabase')
const { getUpdate } = require('../../api')
const wait = require('../../utils/wait')
const getTrackChannel = require('../../utils/getTrackChannel')

const EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *'

const cronTime = EVERY_DAY_AT_MIDNIGHT

function update (client) {
  console.log('Service started : update players every day')

  const job = new CronJob({
    cronTime,
    onTick: massUpdatePlayers,
    timeZone: 'Europe/Paris'
  })

  async function massUpdatePlayers () {
    try {
      // Get all tracked players
      // @TODO Paginate them if there is too much to fetch
      const { data: trackedPlayers, count } = await supabase
        .from('tracked_users')
        .select('*', { count: 'exact' })

      console.log(`Update service: ${count} players to update`)

      // Merge same osu_id in the same object so we don't iterate over them 2 times
      // It allows us to do only one request for the update, then send the embed to multiple channels if needed
      const uniqueTrackedPlayers = {}

      for (const player of trackedPlayers) {
        // Add the player to the unique list
        if (!uniqueTrackedPlayers[player.osu_id]) {
          uniqueTrackedPlayers[player.osu_id] = {
            id: player.id,
            osu_id: player.osu_id,
            osu_username: player.osu_username
          }

          // Create the guilds array, so we can add multiple guilds to one player
          uniqueTrackedPlayers[player.osu_id].guilds = [player.guild_id]
        } else {
          // We found a duplicate of the player, add the other guild to the array
          uniqueTrackedPlayers[player.osu_id].guilds.push(player.guild_id)
        }
      }

      // Update all the players
      for (const id in uniqueTrackedPlayers) {
        const player = uniqueTrackedPlayers[id]

        const channelsFetches = player.guilds.map(guildId => getTrackChannel(guildId, client))

        try {
          const [embed, channels] = await Promise.all([
            getUpdate(null, player.osu_id),
            Promise.all(channelsFetches)
          ])

          for (const channel of channels) {
            channel.send(embed)
          }
        } catch (error) {
          console.error('update', player)
          console.error(error)
        }
      }
    } catch (error) {
      console.error(error)
    }
  }

  return job
}

module.exports = update
