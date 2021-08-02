export const defaultPrefix = process.env.NODE_ENV === 'production' ? '!' : '!!'
export const apiPort =
  process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 3000)
export const maxTrackedUsersInGuild = 100
export const maxUsersUpdatedSimultaneously = 15
export const maxRequestsBeforeSleep = 100
