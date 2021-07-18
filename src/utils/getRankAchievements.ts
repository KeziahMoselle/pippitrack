import ACHIEVEMENTS from '../data/achievements.json'

const RANK_ACHIEVEMENTS_ID = [50, 51, 52, 53]
const MEDALS_URL = [
  // 50,000 -> index 0
  'https://cdn.discordapp.com/attachments/862370264313233439/865704032543047680/rank50000.png',
  // 10,000 -> index 1
  'https://cdn.discordapp.com/attachments/862370264313233439/865704030381932564/rank10000.png',
  // 5,000 -> index 2
  'https://cdn.discordapp.com/attachments/862370264313233439/865704028209020958/rank5000.png',
  // 1,000 -> index 3
  'https://cdn.discordapp.com/attachments/862370264313233439/865704024656445481/rank1000.png'
]

/**
 * Filter the achievements to only return the rank medals
 *
 * @param {array} achievements
 */
export default function getRankAchievements (achievements) {
  const medals = achievements.reduce((rankAchievements, achievement) => {
    if (RANK_ACHIEVEMENTS_ID.includes(achievement.achievement_id)) {
      const achievementData = ACHIEVEMENTS.find(data => data.id === achievement.achievement_id)
      rankAchievements.push({
        achieved_at: achievement.achieved_at,
        ...achievementData
      })
    }

    return rankAchievements
  }, [])

  const medalsUrl = MEDALS_URL[medals.length - 1]

  return {
    medals,
    medalsUrl
  }
}
