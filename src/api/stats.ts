import { FastifyReply, FastifyRequest } from 'fastify'
import client from '../libs/client'

export default async function stats (
  request: FastifyRequest,
  reply: FastifyReply
) {
  reply.header('Access-Control-Allow-Origin', '*')

  return {
    count: {
      guilds: client.guilds.cache.size
    },
    uptime: client.uptime,
    readyAt: client.readyAt,
    guilds: client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      preferredLocale: guild.preferredLocale,
      createdTimestamp: guild.createdTimestamp
    }))
  }
}
