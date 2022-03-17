import { FastifyReply, FastifyRequest } from 'fastify'
import client from '../libs/client'

export default async function topPlays (
  request: FastifyRequest,
  reply: FastifyReply
) {
  reply.header('Access-Control-Allow-Origin', '*')

  return {
    guilds: client.guilds.cache.size,
    readyAt: client.readyAt
  }
}
