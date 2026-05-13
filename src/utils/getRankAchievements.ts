import ACHIEVEMENTS from "../data/achievements.json";

const RANK_ACHIEVEMENTS_ID = [50, 51, 52, 53];
const MEDALS_URL = [
  // 50,000 -> index 0
  "https://reverie.moe/pippitrack/rank50000.png",
  // 10,000 -> index 1
  "https://reverie.moe/pippitrack/rank10000.png",
  // 5,000 -> index 2
  "https://reverie.moe/pippitrack/rank5000.png",
  // 1,000 -> index 3
  "https://reverie.moe/pippitrack/rank1000.png",
];

/**
 * Filter the achievements to only return the rank medals
 *
 * @param {array} achievements
 */
export default function getRankAchievements(achievements) {
  const medals = achievements.reduce((rankAchievements, achievement) => {
    if (RANK_ACHIEVEMENTS_ID.includes(achievement.achievement_id)) {
      const achievementData = ACHIEVEMENTS.find(
        (data) => data.id === achievement.achievement_id
      );
      rankAchievements.push({
        achieved_at: achievement.achieved_at,
        ...achievementData,
      });
    }

    return rankAchievements;
  }, []);

  const medalsUrl = MEDALS_URL[medals.length - 1];

  return {
    medals,
    medalsUrl,
  };
}
