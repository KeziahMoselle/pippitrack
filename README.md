![cover](.github/cover.jpg)

![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/KeziahMoselle/osu-track/lint/main?label=lint&style=flat-square)

# PippiTrack

A Discord bot that allows you to track osu! things. It has some useful commands too.

## [Invite PippiTrack to your server](https://invite.pippitrack.com/)

## How do I report a bug or request a feature ?

- [Join the PippiTrack Discord server](https://discord.pippitrack.com/)
- [Create an issue](https://github.com/KeziahMoselle/pippi-track/issues/new) on this repository.
- Contact me on Discord (**Keziah#6631**)

## How do I use PippiTrack ?

### See documentation at [https://pippitrack.com/](https://pippitrack.com/)

### Get started

#### For users

Start by linking your Discord account to an osu! username like so :

```
/link <username> <mode>
```

[See all commands](#list-of-commands)

#### For administrators

After inviting the bot to your server, you need to configure it.

```
/configure
```

![configure](.github/config.gif)

Track a user (top plays, weekly updates and replays)
You can track up to 100 players.

```
/track <username>
```

```
/untrack <username>
```

```
/tracklist <?page>
```

### List of commands

Update an osu! profile via [osu!track](https://ameobea.me/osutrack/)

```
/update <?username>
```

![update](.github/update.png)

Display peak rank and accuracy of a player

```
/score <?username>
```

```
/gifted <?username>
```


```
/peak <?username>
```

![peak](.github/peak.png)

Display your profile stats via [osu!sig](https://lemmmy.pw/osusig/)

```
/osu <?username>
```

![osusig](.github/osusig.png)


### Tracking

#### Top plays (Need polish)

![top play tracking](.github/top_play_tracking.png)

#### Updates

Tracked players are queued for an automatic [osu!track](https://ameobea.me/osutrack/) update. (Once a day)

![mass updates](.github/updates.png)

#### Replays (o!rdr)

Tracked players that use [o!rdr](https://ordr.issou.best/) will have their replays sent in the replay channel. (if set)

![replays](.github/new_replay.png)

## Installation

Have [Node.js](https://nodejs.org/) (version 16.8.x or newer) installed.

```bash
npm install
```

Then copy the `.env.example` to `.env` and fill in the values.

To run the bot in development mode run :

```bash
npm run dev
```

To run the bot in production mode run :

```bash
npm run build && npm run start
```

## Directory structure

### `src/commands`

Commands are classes that exports a `run` method and several properties.

```js
class Command {
  name = 'command-name' // !command-name
  arguments = ['username'] // Accepted arguments for the command !command-name <username>
  description = 'Description of the command' // Used for the !help command
  category = 'general'

  async run(message, args) {}
}
```

### `src/services`

Services needs to export a function that triggers the service (running a cron job, etc)

### `src/Bot.js`

The `Bot.js` file is used for the internal logic of the bot.
We'll add listeners to the bot's events and handle the commands.

## Credits

### Services

- [https://ameobea.me/osutrack/](https://ameobea.me/osutrack/) osutrack is a statistics tracker for the game osu!. It stores user information in a database and creates graphs and displays statistics showing how that users' stats changed over time.. A project by [ameobea](https://ameobea.me/)
- [o!rdr](https://ordr.issou.best/) o!rdr is a free online tool to make renders of osu! replays using [Danser](https://github.com/Wieku/danser-go). Made by [MasterIO](https://github.com/MasterIO02/)
- [https://lemmmy.pw/osusig/](https://lemmmy.pw/osusig/) for the `!osu` profile image. Created by [Lemmmy](https://osu.ppy.sh/users/4656511)

### Art

- [AKARA](https://akara.fr/) Thank you for the art ! (Badges cover of the `!peak` command)
- [Bouf](https://osu.ppy.sh/users/4431069) for the name `PippiTrack` and the edit of Koigokoro avatar !

## License

[MIT](./LICENSE)
