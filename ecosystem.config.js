require('dotenv').config()

module.exports = {
  apps : [
    {
      name   : 'osu-tracking',
      script : './src/index.js',
      watch: ['src'],
      ignore_watch: ['node_modules'],
      watch_delay: 1000,
      out_file: './log.txt',
      error_file: './error.txt',
      env: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
      },
      env_development: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
}