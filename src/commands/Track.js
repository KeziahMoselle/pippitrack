const { MessageEmbed } = require('discord.js')
const { osu } = require('../libs/osu')
const supabase = require('../libs/supabase')
const getUser = require('../utils/getUser')

class TrackCommand {
  name = 'track'
  arguments = ['username']
  description = 'Allows you to track top plays and replays. Also enable daily updates of your profile.'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   * @memberof TrackCommand
   */
  async run (message, args) {
    const user = await getUser({ message, args })

    try {
      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('osu_id').eq('osu_id', user.id)

      // If we find a result there is already a player tracked.
      if (userFound.length > 0) {
        const embed = new MessageEmbed()
        .setTitle('Player already tracked')
        .setDescription(`**${user.name}** is already being tracked.`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)

        return message.channel.send(embed)
      }

      // Track the user
      const { error } = await supabase
        .from('tracked_users')
        .insert([{
          osu_id: user.id,
          osu_username: user.name
        }])

      if (error) {
        console.error(error)
        return message.reply('Sorry, there was an error.')
      }

      const embed = new MessageEmbed()
        .setTitle(`Now tracking : ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${args.join(' ')}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}

module.exports = TrackCommand