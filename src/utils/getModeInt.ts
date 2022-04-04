export default function getModeInt (mode: string): 0 | 1 | 2 | 3 {
  const modes = {
    osu: 0,
    taiko: 1,
    fruits: 2,
    ctb: 2,
    mania: 3
  }

  return modes[mode]
}
