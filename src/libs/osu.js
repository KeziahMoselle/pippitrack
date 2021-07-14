const osu = require('node-osu')

const osuApi = new osu.Api(process.env.OSU_API_KEY, {
  completeScores: true,
  parseNumeric: false,
  notFoundAsError: false
})

module.exports = {
  osu: osuApi
}
