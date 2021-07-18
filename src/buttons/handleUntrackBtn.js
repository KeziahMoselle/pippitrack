const { MessageEmbed } = require('discord.js')
const { MessageButton } = require('discord-buttons')
const untrackUser = require('../utils/untrackUser')

async function handleUntrackBtn (button) {
  const [, id] = button.id.split('_')

  // Check if the author has the permission to untrack the user
  if (!button.clicker.member.hasPermission('ADMINISTRATOR')) {
    return button.reply.send('You need to be an Administrator to untrack players.', true)
  }

  await button.reply.defer()

  const { data: untrackedUser, error } = await untrackUser(id)

  if (error) {
    return await button.reply.send('Sorry, there was an error.', true)
  }

  const embed = new MessageEmbed()
    .setTitle(`${untrackedUser.osu_username} has been untracked`)

  const untrackBtn = new MessageButton()
    .setStyle('grey')
    .setLabel('Untracked')
    .setID('untrack_disabled')
    .setDisabled()

  await button.message.edit(embed, untrackBtn)
}

module.exports = handleUntrackBtn
