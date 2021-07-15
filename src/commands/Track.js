const { MessageEmbed } = require('discord.js')
const { MessageButton } = require('discord-buttons')
const supabase = require('../libs/supabase')
const getUser = require('../utils/getUser')
const notFoundEmbed = require('../utils/notFoundEmbed')

class TrackCommand {
  name = 'track'
  arguments = ['username']
  description = 'Allows you to track top plays and replays. Also enable daily updates of your profile.'
  category = 'osu'

  /**
   * @param {module:discord.js.Message} message
   * @param {string[]} args
   */
  async run (message, args) {
    const user = await getUser({ message, args })

    if (!user || user.length === 0) {
      return message.channel.send(notFoundEmbed)
    }

    try {
      const { data: userFound } = await supabase
        .from('tracked_users')
        .select('*')
        .eq('osu_id', user.id)
        .eq('guild_id', message.guild.id)
        .single()

      // If we find a result there is already a player tracked.
      if (userFound && message.guild.id === userFound.guild_id) {
        const embed = new MessageEmbed()
          .setTitle('Player already tracked')
          .setDescription(`**${user.name}** is already being tracked.`)
          .setThumbnail(`http://s.ppy.sh/a/${user.id}`)

        const untrackBtn = new MessageButton()
          .setStyle('red')
          .setLabel('Untrack')
          .setID(`untrack_${message.author.id}_${userFound.id}`)

        const IN_ONE_MINUTE = 60 * 1000

        const sentMessage = await message.channel.send(embed, untrackBtn)

        setTimeout(() => {
          sentMessage.edit(embed, untrackBtn.setDisabled())
        }, IN_ONE_MINUTE)
        return
      }

      // Track the user
      const { error } = await supabase
        .from('tracked_users')
        .upsert({
          id: userFound?.id,
          osu_id: user.id,
          osu_username: user.name,
          guild_id: message.guild.id
        })
        .eq('guild_id', message.guild.id)

      if (error) {
        if (error.code === '23503') { // Constraint key doesn't exist
          const embed = new MessageEmbed()
            .setTitle('You need to set a tracking channel first')
            .setDescription('Type `!set track` or `!set replay` in the channel of your choice then type `!track <?username>`.')
          return message.channel.send(embed)
        }
        return message.reply('Sorry, there was an error.')
      }

      const embed = new MessageEmbed()
        .setTitle(`Now tracking : ${user.name}`)
        .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
        .addField('Rank', `#${user.pp.rank}`, true)
        .addField('mode', 'osu!', true)
        .setColor(11279474)

      message.channel.send(embed)
    } catch (error) {
      console.error(error)
      const embed = new MessageEmbed()
        .setTitle(`Player not found : ${args.join(' ')}`)
        .setThumbnail('https://a.ppy.sh/')

      return message.channel.send(embed)
    }
  }
}

module.exports = TrackCommand
