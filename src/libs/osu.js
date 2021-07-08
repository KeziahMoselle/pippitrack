const osu = require('node-osu')

const osuApi = new osu.Api(process.env.OSU_API_KEY, {
	completeScores: true,
	parseNumeric: false
});

module.exports = osuApi