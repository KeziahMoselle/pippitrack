const { MessageEmbed } = require('discord.js')
const { osu } = require('../libs/osu')
const supabase = require('../libs/supabase')
const getUser = require('../utils/getUser')

class LinkCommand {
  name = 'link'
  arguments = ['username']
  description = 'Link your Discord account to an osu! username'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   * @memberof LinkCommand
   */
   async run (message, args) {
     try {
      const user = await getUser({ message, args })

      const embed = new MessageEmbed()
        .setTitle(`${message.member.displayName} has been set to ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      const { data: isDiscordUserPresent } = await supabase
        .from('users')
        .select('discord_id')
        .eq('discord_id', message.author.id)

      // If the Discord ID is present, update instead of insert
      if (isDiscordUserPresent.length > 0) {
        const { data, error } = await supabase
          .from('users')
          .update({ osu_id: user.id })
          .eq('discord_id', message.author.id)

          if (error) {
            console.error(error)
            return message.reply('Sorry, there was an error.')
          }

        return message.channel.send(embed)
      }

      // Link the Discord ID to the osu id
      const { error } = await supabase
        .from('users')
        .insert([{
          discord_id: message.author.id,
          osu_id: user.id
        }])

      if (error) {
        console.error(error)
        return message.reply('Sorry, there was an error.')
      }

      message.channel.send(embed)
    } catch {
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${username}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}

module.exports = LinkCommand