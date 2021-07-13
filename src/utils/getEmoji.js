const RANK_EMOJIS = {
  ssh: '<:rank_ssh:864503329996668968>',
  ss: '<:rank_ss:864503330448474142>',
  s: '<:rank_s:864503422987010049>',
  sh: '<:rank_sh:864503423311675412>',
  a: '<:rank_a:864503471612362843>',
  c: '<:rank_c:864628617740025877>',
  b: '<:rank_b:864628978605096990>',
  f: '<:rank_f:864629121354432563>',
}

function getEmoji(rank) {
  if (RANK_EMOJIS[rank]) {
    return RANK_EMOJIS[rank];
  }
}

module.exports = getEmoji