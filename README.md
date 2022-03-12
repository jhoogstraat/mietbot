# Mietbot

This bot watches websites and notifies you when the html did change by a certain percentage.
I use this bot to look for cooperative flats. There is list of url in the `main.ts` for Hamburg, Germany.

## Configure Mietbot

* Create a new application on discord (https://discord.com/developers/applications)
* Give it the `bot` and `applications.commands` scopes aswell as the `Send Messages` permission
* Put the access token in a .env file (TOKEN=XXXX)
* Put the guild (GUILD_ID) you want to have the commands and client id (CLIENT_ID) of the bot also in the .env file.
* Execute `npm i` and `npm run commands` to install the (/) commands on the guild
* Execute `npm run start` to start the bot

## (/) Commands
* /watch (url) - Watches the website at the url given
* /unwatch (url) - Stops watching the url given
* /list - Lists all the currenly watched websites

## Options
* Fetches websites every 5 minutes
* Looks for 0.0001% differences in the html

## License

[MIT](https://github.com/jhoogstraat/mietbot/blob/main/LICENSE)