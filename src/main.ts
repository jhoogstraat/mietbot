import 'dotenv/config'
import { scheduleJob } from "node-schedule"
import { Worker } from "bullmq"

import { Appartment } from "./appartment_type"
import Scraper from "./scaper/scaper"
import Database from "./db/database"
import DiscordBot from "./discord-connector/bot"

async function main() {
  /* Database */
  const db = await Database.init()
  console.log("[Database] initialized")

  /* Scraper */
  const scraperQueueName = "scrape_queue"
  const scraper = await Scraper.init(scraperQueueName)
  console.log("[Scraper] initialized")

  /* Discord Bot */
  const subscriptions = await db.getSubscriptions()
  const bot = await DiscordBot.init(subscriptions)

  /* Scheduler */
  const every5Minutes = '0 */5 * * * *'
  const every10Seconds = '*/10 * * * * *'
  scheduleJob(every5Minutes, (date) => {
    scraper.run().catch(err => bot.log(`[Scraper] ${err}`))
  })
  console.log("[Scheduler] initialized")

  /* BullMQ Queue Worker */
  const databaseWorker = new Worker<Appartment[], void>(scraperQueueName, async (job) => {
    try {
      if (job.name != 'error')
        await db.update(job.data)
    } catch (error) {
      console.error(error)
    }
  }, { connection: { host: "localhost", port: 6379 }, sharedConnection: true })

  const discordWorker = new Worker<Appartment[], void>(scraperQueueName, async (job) => {
    try {
      if (job.name == 'error') {
        console.error(job.data)
        await bot.log("" + job.data)
      }
      else {
        await bot.post(job.data)
      }
    } catch (error) {
      console.error(error)
      await bot.log("" + error)
    }
  }, { connection: { host: "localhost", port: 6379 }, sharedConnection: true })

}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


/* when stopping your app
await scraper.deinit()
scheduler.stop()
*/