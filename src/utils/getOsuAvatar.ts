function getOsuAvatar (id: string | number): string {
  return `https://s.ppy.sh/a/${id}?v=${new Date().getTime()}`
}

export default getOsuAvatar
