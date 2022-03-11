import { Client, Intents, TextBasedChannel } from 'discord.js'
import urlExist from "url-exist"
import { monitor, WebPage } from "web-monitoring"

import 'dotenv/config'
import * as Persistance from "./persistance.js"

// Pull
// https://www.hamburgerwohnen.de/wohnungsbestand/freie-wohnungen.html
// https://kaifu.de/wohnen/hamburg
// https://2222820.hpm.immosolve.eu/?startRoute=result-list&objectIdentifier=2#!/result-list-2%60
// https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/
// https://www.buchdrucker.de/de/wohnungsangebote
// https://dhu.hamburg/wohnen/wohnungsangebote/

// Push
// https://www.saga.hamburg/immobiliensuche
// https://www.hanseatische.de/de/wohnungsangebote
// https://hansa-baugenossenschaft.de/wohnen/unsere-wohnungen
// https://wv1902.de/wohnungsangebote/
// https://www.vhw-hamburg.de/wohnen/aktuelle-angebote.html

// ??
// https://portal.immobilienscout24.de/ergebnisliste/45584335

async function watch(url: string, channel: TextBasedChannel): Promise<WebPage> {
  if (!await urlExist(url)) throw `Url invalid: ${url}`

  const watch: WebPage = monitor(url, { percentageDiff: 0.0001, lapse: 300000 })
    .on('start', (url) => console.log(`Watching ${url}' for channel ${channel.id}`))
    .on('alert', (url, page) => {
      channel.send(`Website changed!\n${url}`)
    })
    .on('error', (err) => {
      console.log(err)
      channel.send(`Error watching website at url: ${url}\n${err}`)
    })
    .start()

  return watch
}

const idSeparator = "<>"

async function main() {
  const token = process.env.TOKEN!
  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] })
  await bot.login(token)

  const runningJobs: Map<String, WebPage> = new Map()

  const jobs = await Persistance.load()

  jobs.forEach(async (job) => {
    const channel = await bot.channels.fetch(job.channel)
    if (channel?.type === "GUILD_TEXT") {
      try {
        const webpage = await watch(job.url, channel)
        runningJobs.set(job.url + idSeparator + job.channel, webpage)
      } catch {
        console.log(`Url not reachable: ${job.url}`)
      }

    } else {
      console.log(`Channel ${job.channel} does not exist or is not a text based channel! Skipping...`)
    }
  })

  bot.once('ready', () => {
    console.log(`Logged in as ${bot.user!.tag}!`)
  })

  bot.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    if (interaction.commandName === 'watch') {
      const url = interaction.options.getString('url', true)
      const id = url + idSeparator + interaction.channelId

      if (runningJobs.has(id)) return interaction.reply(`Already watching url ${url}`)

      const webpage = await watch(url, interaction.channel!)

      runningJobs.set(id, webpage)
      jobs.set(id, { url: url, channel: interaction.channelId })
      await Persistance.save(jobs)

      interaction.reply(`Watching ${url} every 5 minute for changes`)
    } else if (interaction.commandName === 'unwatch') {
      const url = interaction.options.getString('url', true)
      const id = url + idSeparator + interaction.channelId

      if (!runningJobs.has(id)) return interaction.reply(`Not watching url: ${url}`)

      runningJobs.get(id).stop()
      runningJobs.delete(id)
      jobs.delete(id)
      await Persistance.save(jobs)

      interaction.reply(`Not watching url anymore: ${url}`)
    } else if (interaction.commandName === 'list') {
      var websites = ""

      for (let id of runningJobs.keys()) {
        if (id.split(idSeparator)[1] == interaction.channelId) {
          websites += jobs.get(id)!.url + "\n"
        }
      }

      interaction.reply(websites.length == 0 ? "Not watching any website currently" : websites)
    } else {
      interaction.reply(`Unknown command: ${interaction.commandName}`)
    }
  })
}

main()


