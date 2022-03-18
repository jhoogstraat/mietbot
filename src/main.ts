import 'dotenv/config'
import { scheduleJob } from "node-schedule"
import { Worker } from "bullmq"

import { Appartment } from "./appartment_type"
import Scraper from "./scraper/scraper"
import Database from "./db/database"
import DiscordBot from "./discord-connector/bot"

async function main() {
  console.log("Booting...")

  /* Database */
  const db = await Database.init()
  console.log("[Database] initialized")

  /* Scraper */
  const scraperQueueName = "scraping_queue"
  const scraper = await Scraper.init(scraperQueueName)
  console.log("[Scraper] initialized")

  /* Discord Bot */
  const subscriptions = await db.getSubscriptions()
  const bot = await DiscordBot.init(subscriptions)

  /* Scheduler */
  const cron = process.env.SCRAPING_INTERVAL!
  scheduleJob(cron, (_: any) => {
    scraper.run().catch(err => bot.log(`[Scraper] ${err}`))
  })
  console.log("[Scheduler] initialized")

  /* BullMQ Queue Worker */
  const listingWorker = new Worker<Appartment[], void>(scraperQueueName, async (job) => {
    if (job.name == 'error') {
      console.error(job.data)
      await bot.log("" + job.data)
      return
    }

    try {
      await db.update(job.data)
    } catch (error) {
      console.error(error)
      await bot.log("" + error)
    }

    try {
      await bot.post(job.data)
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