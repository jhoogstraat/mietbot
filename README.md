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
[Overview (Map)](https://wohnungsbaugenossenschaften-hh.de/hier-sind-wir-zuhaus/)
  - [Allgemeine Deutsche Schiffszimmerer-Genossenschaft eG](https://www.schiffszimmerer.de/bei-uns-wohnen/wohnungsangebote.html)
  - [Altonaer Spar- und Bauverein eG](https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2%60)
  - [Baugenossenschaft der Buchdrucker eG](https://buchdrucker.immomio.de/)
  - [Baugenossenschaft dhu eG](https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2223228/HP/immo.jsp) ✅
  - [Baugenossenschaft Dennerstraße-Selbsthilfe eG](https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/) ✅
  - [Baugenossenschaft Finkenwärder-Hoffnung eG](https://www.fwheg.de/wohnungen/wohnungsangebote)
  - [Baugenossenschaft FLUWOG-NORDMARK eG](https://www.fluwog.de/wohnen/wohnungssuche/)
  - [Baugenossenschaft Fuhlsbüttel eG](https://portal.immobilienscout24.de/ergebnisliste/15339103)
  - [Baugenossenschaft freier Gewerkschafter eG](https://www.bgfg.de/zuhause-finden/aktuelle-angebote)
  - [Baugenossenschaft Hamburger Wohnen eG](https://www.hamburgerwohnen.de/wohnungsbestand/freie-wohnungen.html)
  - [Bauverein der Elbgemeinden eG](https://www.bve.de/wohnen-beim-bve/wohnungsbestand/wohnungsangebote/) ✅
  - [Bauverein Reiherstieg eG](https://www.reiherstieg.de/wohnungsangebote/)
  - [Eisenbahnbauverein Harburg eG](https://www.ebv-harburg.de/wohnungen/wohnungsangebote/)
  - [Gartenstadt Hamburg eG](https://www.gartenstadt-hamburg.de/angebote/)
  - [Gemeinnützige Baugenossenschaft Bergedorf-Bille eG](https://bergedorf-bille.de/fileadmin/immosolve/#!/start-rent)
  - [Hamburger Lehrer-Baugenossenschaft eG](https://portal.immobilienscout24.de/ergebnisliste/45584335)
  - [HARABAU Hamburg-Rahlstedter Baugenossenschaft eG](https://harabau.de/vermietung/wohnungen)
  - [HANSA Baugenossenschaft eG](https://hansa-baugenossenschaft.de/wohnen/unsere-wohnungen)
  - [Hanseatische Baugenossenschaft Hamburg eG](https://www.hanseatische.de/de/wohnungsangebote) ✅
  - [SAGA Unternehmensgruppe](https://www.saga.hamburg/immobiliensuche) ✅
  - [Vereinigte Hamburger Wohnungsbaugenossenschaft eG](https://www.vhw-hamburg.de/wohnen/aktuelle-angebote.html)
  - [Walddörfer Wohnungsbaugenossenschaft eG](https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2227215/HP/immo.jsp) ✅
  - [Wohnungsbaugenossenschaft Gartenstadt Wandsbek eG](https://www.gartenstadt-wandsbek.de/wohnen/freie-wohnungen/)
  - [Wohnungsbaugenossenschaft KAIFU-NORDLAND eG](https://kaifu.de/wohnen/hamburg) ✅
  - [Wohnungsbaugenossenschaft Süderelbe eG](https://www.baugen-suederelbe.de/wohnungangebote/)
  - [Wohnungsgenossenschaft Hamburg-Wandsbek von 1897 eG](https://www.whw1897.de/wohnen-bei-der-whw.html) (application)
  - [Wohnungsgenossenschaft von 1904 e.G.](https://www.1904.de/wohnungen/wohnungssuche) (application)
  - [Wohnungsverein Hamburg von 1902 eG](https://wv1902.de/wohnungsangebote/)

# License
[MIT](https://github.com/jhoogstraat/mietbot/blob/main/LICENSE)