const { MessageEmbed } = require('discord.js')
const { osu } = require('../libs/osu')
const supabase = require('../libs/supabase')

class TrackCommand {
  name = 'track'
  arguments = ['username']
  description = '~~Track top plays of a player~~'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   * @memberof TrackCommand
   */
  async run (message, args) {
    // Allow username with whitespaces
    const username = args.join(' ')

    console.log(message.mentions)
    if (message.mentions) {
      const firstMention = message.mentions.users.first()

      console.log(firstMention)

      const { data: savedUsername } = await supabase
        .from('users')
        .select('osu_id').eq('discord_id', message.member.id).single()

      if (savedUsername) {
        type = 'id'
        osu_id = savedUsername.osu_id
      } else {
        message.reply(``)
      }
    }

    try {
      const user = await osu.getUser({
        u: username
      })

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
        .setTitle(`Player not found : ${username}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}

module.exports = TrackCommand