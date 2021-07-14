require('dotenv').config()

module.exports = {
  apps: [
    {
      name: 'osu-tracking',
      script: './src/index.js',
      watch: ['src'],
      ignore_watch: ['node_modules'],
      watch_delay: 1000,
      out_file: './log.txt',
      error_file: './error.txt',
      env: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        OSU_API_KEY: process.env.OSU_API_KEY,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      },
      env_development: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
