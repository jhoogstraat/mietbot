# Mietbot

This bot that watches listings of building cooperatives and notifies you when a new listing is posted.

## Configure Mietbot

1. Create a new application on discord (https://discord.com/developers/applications)
2. Give it the `bot` and `applications.commands` scopes aswell as the `Send Messages` permission
3. Copy `.env.example` to `.env` and fill out the fields.
4. Execute `npm i --production` and `npm run build`
5. Execute `npm run commands` to install the (/) commands on the guild
6. Start redis and mongodb using docker (`npm run start-redis` and `npm run start-mongodb`)
7. Execute `npm run start` to start the bot

## (/) Commands
* /subscribe - Subscribes the current channel for listing updates
* /unsubscribe - Stop posting listings in the current channel
* /list - Lists all the currenly watched building cooperatives

# Genossenschaften
Links to active listings
## Hamburg
  - [Baugenossenschaft Dennerstraße-Selbsthilfe eG](https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/) ✅
  - [SAGA Unternehmensgruppe](https://www.saga.hamburg/immobiliensuche) ✅
  - [Wohnungsbaugenossenschaft KAIFU-NORDLAND eG](https://kaifu.de/wohnen/hamburg)
  - [Hanseatische Baugenossenschaft Hamburg eG](https://www.hanseatische.de/de/wohnungsangebote)
  - [Altonaer Spar- und Bauverein eG](https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2%60)
  - [Walddörfer Wohnungsbaugenossenschaft eG](https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2227215/HP/immo.jsp) ✅
  - [Baugenossenschaft der Buchdrucker eG](https://buchdrucker.immomio.de/)
  - [Baugenossenschaft dhu eG](https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2223228/HP/immo.jsp)
  - [HANSA Baugenossenschaft eG](https://hansa-baugenossenschaft.de/wohnen/unsere-wohnungen)
  - [Vereinigte Hamburger Wohnungsbaugenossenschaft eG](https://www.vhw-hamburg.de/wohnen/aktuelle-angebote.html)
  - [Wohnungsverein Hamburg von 1902 eG](https://wv1902.de/wohnungsangebote/)

## License

[MIT](https://github.com/jhoogstraat/mietbot/blob/main/LICENSE)