import client from "../libs/client";
import { Rank } from "../types/osu";

const RANK_EMOJIS = {
  ssh: "<:rank_ss:1504157073032613969>",
  xh: "<:rank_ss:1504157073032613969>",
  ss: "<:rank_ss:1504157073032613969>",
  x: "<:rank_ss:1504157073032613969>",
  s: "<:rank_s:1504157397101576242>",
  sh: "<:rank_sh:1504157006041452584>",
  a: "<:rank_a:1504157465330323516>",
  c: "<:rank_c:1504157183519232070>",
  b: "<:rank_b:1504157360623452230>",
  d: "<:rank_d:1504156918204072007>",
  f: "",
  bpm: "<:bpm:1504157231078310079>",
  total_length: "<:total_length:1504157247289168002>",
  count_circles: "<:count_circles:1504159864878923776>",
  count_sliders: "<:count_sliders:1504159883786850436>",
  diff_green: "<:green:1504157508715937862>",
  diff_orange: "<:orange:1504157524268421280>",
  diff_blue: "<:blue:1504157321394130995>",
  diff_black: "<:black:1504157275080622081>",
  osu: "<:std:1504157486670675988>",
  mania: "<:mania:1504157305145397269>",
  taiko: "<:taiko:1504157291094609981>",
  fruits: "<:fruits:1504157212652732577>",
};

type Emojis =
  | "bpm"
  | "total_length"
  | "count_circles"
  | "count_sliders"
  | "diff_green"
  | "diff_orange"
  | "diff_blue"
  | "diff_black"
  | "osu"
  | "mania"
  | "taiko"
  | "fruits";

export default function getEmoji(rank: Rank | Emojis | string): string {
  const rankLetter = rank.toLowerCase();

  if (RANK_EMOJIS[rankLetter]) {
    return RANK_EMOJIS[rankLetter];
  }

  const emoji = client.emojis.cache.find(
    (emoji) => emoji.name === `rank_${rankLetter}`
  );

  if (emoji) {
    return emoji.toString();
  }

  console.error(`${rankLetter} emoji does not exist.`);
  return "";
}
