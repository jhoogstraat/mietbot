import { Client, Intents } from "discord.js"
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from "toad-scheduler"
import Scraper from "./scaper/scaper"

async function main() {
  /* Discord Bot */
  const token = process.env.TOKEN!
  const debugChannelId = process.env.DEBUG_CHANNEL!

  const bot = new Client({ intents: [Intents.FLAGS.GUILDS] })
  await bot.login(token)
  const debugChannel = await bot.channels.fetch(debugChannelId)

  if (debugChannel?.type !== "GUILD_TEXT") {
    throw "Debug channel not text based!"
  }

  /* Scraping */
  const scaper = await Scraper.init()
  const scheduler = new ToadScheduler()
  const task = new AsyncTask(
    'scape-websites',
    scaper.run,
    (err: Error) => { debugChannel.send(`[Scheduler]: ${err}`) }
  )

  const job = new SimpleIntervalJob({ minutes: 5 }, task)
  scheduler.addSimpleIntervalJob(job)

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
      interaction.reply(`Watching for changes`)
    } else if (interaction.commandName === 'unwatch') {
      interaction.reply(`Not watching anymore`)
    } else if (interaction.commandName === 'list') {

    }
  })
}

main()

/* when stopping your app
await scraper.deinit()
scheduler.stop()
*/