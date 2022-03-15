import { Client, Intents } from "discord.js"
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from "toad-scheduler"
import { Worker } from "bullmq"
import { Inserat } from "./provider_type"
import Scraper from "./scaper/scaper"
import 'dotenv/config'

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

  console.log(`[Bot] Logged in as ${bot.user!.tag}! Debug channel-id: ${debugChannel.id}`)

  /* Scraper */
  const queueName = process.env.QUEUE_NAME!
  const scaper = await Scraper.init(queueName)
  console.log("Scraper initialized")

  /* Scheduler */
  const scheduler = new ToadScheduler()
  const task = new AsyncTask(
    'scape-websites',
    () => scaper.run(),
    (err: Error) => { debugChannel.send(`[Scheduler] ${err}`) }
  )

  const worker = new Worker<Inserat[], void>(queueName, async (job) => {
    console.log(job.data)
  }, { connection: { connection: { host: "localhost", port: 6379 }, sharedConnection: true }, sharedConnection: true })

  const job = new SimpleIntervalJob({ seconds: 10 }, task)
  scheduler.addSimpleIntervalJob(job)

  console.log("Scheduler initialized")


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