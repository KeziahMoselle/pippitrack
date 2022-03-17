import client from '../libs/client'
import { Rank } from '../types/osu'

const RANK_EMOJIS = {
  ssh: '<:rank_ssh:864503329996668968>',
  xh: '<:rank_ssh:864503329996668968>',
  ss: '<:rank_ss:864503330448474142>',
  x: '<:rank_ss:864503330448474142>',
  s: '<:rank_s:864503422987010049>',
  sh: '<:rank_sh:864503423311675412>',
  a: '<:rank_a:864503471612362843>',
  c: '<:rank_c:864628617740025877>',
  b: '<:rank_b:864628978605096990>',
  d: '<:rank_d:871723113111502908>',
  f: '<:rank_f:864629121354432563>',
  bpm: '<:bpm:949375789332324432>',
  total_length: '<:total_length:949375789462343740>',
  count_circles: '<:count_circles:949375789604962405>',
  count_sliders: '<:count_sliders:949375789630099478>',
  diff_green: '<:green:949378988718043166>',
  diff_orange: '<:orange:949378988940333136>',
  diff_blue: '<:blue:949378988739010630>',
  diff_black: '<:black:949378988684476416>',
  osu: '<:osu:949398794502549514>',
  mania: '<:mania:949398794460606474>',
  taiko: '<:taiko:949398794846474281>',
  fruits: '<:fruits:949398794590646272>'
}

type Emojis =
  'bpm' |
  'total_length' |
  'count_circles' |
  'count_sliders' |
  'diff_green' |
  'diff_orange' |
  'diff_blue' |
  'diff_black' |
  'osu' |
  'mania' |
  'taiko' |
  'fruits'

export default function getEmoji (rank: Rank | Emojis | string): string {
  const rankLetter = rank.toLowerCase()

  if (RANK_EMOJIS[rankLetter]) {
    return RANK_EMOJIS[rankLetter]
  }

  const emoji = client.emojis.cache.find(
    (emoji) => emoji.name === `rank_${rankLetter}`
  )

  if (emoji) {
    return emoji.toString()
  }

  console.error(`${rankLetter} emoji does not exist.`)
  return ''
}
