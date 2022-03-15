import { Client, Intents, MessageEmbed } from "discord.js"
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

  const discordWorker = new Worker<Inserat[], void>(queueName, async (job) => {
    console.log(job.data)
    const embeds = job.data.map((inserat) => new MessageEmbed()
      .setTitle(`${inserat.space.roomCount} Zimmer in ${inserat.address.district ?? inserat.address.zipCode}`)
      .setURL(inserat.detailURL)
      .setImage(inserat.previewImageURL ?? "")
      .addField("Wohnfläche", `ca. ${inserat.space.area} m²`, true)
      .addField("Netto-Kaltmiete", `${inserat.rentCold} €`, true)
      .addField("Addresse", `[${inserat.address.street} ${inserat.address.number}](https://maps.google.com/?q=${encodeURIComponent(inserat.address.street + " " + inserat.address.number + " " + inserat.address.zipCode)})`)
      .addField("Anbieter", `${inserat.provider}`)
    )

    await debugChannel.send({ embeds: embeds })
  }, { connection: { connection: { host: "localhost", port: 6379 }, sharedConnection: true }, sharedConnection: true })

  const errorWorker = new Worker<Inserat[], void>('error', async (job) => {
    const errorDescription = `[Scraper] ${job.data}`
    console.log(errorDescription)
    await debugChannel.send(errorDescription)
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

    if (interaction.commandName === 'subscribe') {
      interaction.reply(`Watching for changes`)
    } else if (interaction.commandName === 'unsubscribe') {
      interaction.reply(`Not watching anymore`)
    }
  })
}

main()

/* when stopping your app
await scraper.deinit()
scheduler.stop()
*/