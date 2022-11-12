/* eslint-disable no-unreachable-loop */
import { CronJob } from 'cron'
import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { osuApiV2 } from '../../libs/osu'
import supabase from '../../libs/supabase'
import { Post } from '../../types/osu'
import getOsuAvatar from '../../utils/getOsuAvatar'

const EVERY_HOUR = '0 */1 * * *'

export default function trackNews (client: Client): CronJob {
  console.log('Service started : osu! news')

  const job = new CronJob({
    cronTime: EVERY_HOUR,
    onTick: getNews,
    timeZone: 'Europe/Paris',
    runOnInit: process.env.NODE_ENV === 'development'
  })

  let lastTimestamp = new Date().getTime()

  async function getNews () {
    try {
      const data = await osuApiV2.getNews({
        limit: 5,
        year: new Date().getFullYear()
      })

      const newPosts: Post[] = []

      for (const post of data.news_posts) {
        const isNew = new Date(post.published_at).getTime() > lastTimestamp

        if (isNew) {
          newPosts.push(post)
        }
      }

      if (newPosts.length === 0) {
        return
      }

      const { data: guilds } = await supabase
        .from('guilds')
        .select('news_channel')
        .neq('news_channel', null)

      const channels = guilds.map(guild => guild.news_channel)

      for (const post of newPosts) {
        let creatorAvatar

        try {
          const creator = await osuApiV2.getUser({
            username: post.author
          })

          creatorAvatar = getOsuAvatar(creator.id)
        } catch (error) {
          creatorAvatar = 'https://a.ppy.sh/1'
        }

        const unixTimestamp = Math.trunc(new Date(post.published_at).getTime() / 1000)

        const embed = new MessageEmbed()
          .setTitle(post.title)
          .setURL(`https://osu.ppy.sh/home/news/${post.slug}`)
          .setAuthor({
            name: `Written by ${post.author}`,
            iconURL: creatorAvatar
          })
          .setImage(post.first_image)
          .setDescription(`${post.preview}\n\n<t:${unixTimestamp}:R>`)

        console.log(`Sending "${post.title}"...`)

        for (const chan of channels) {
          try {
            const channel = client.channels.cache.get(chan) as TextChannel
            channel.send({ embeds: [embed] })
          } catch (error) {
            console.error('Cannot get channel', chan)
          }
        }
      }

      lastTimestamp = new Date().getTime()
    } catch (error) {
      console.error('newBeatmaps', error)
    }
  }

  return job
}
