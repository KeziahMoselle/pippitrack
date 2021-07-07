const CronJob = require('cron').CronJob
const client = require('./libs/client')

client.once('ready', async () => {
  console.log(`${client.user.username} is ready !`)
})

client.login(process.env.DISCORD_BOT_TOKEN)