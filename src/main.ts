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
  const listings = await db.getListings()
  const scraper = await Scraper.init(scraperQueueName, listings)
  console.log("[Scraper] initialized")

  /* Discord Bot */
  const subscriptions = await db.getSubscriptions()
  const subscriptionQueueName = 'subscriptions'
  const bot = await DiscordBot.init(subscriptions, subscriptionQueueName)

  /* Scheduler */
  const cron = process.env.SCRAPING_INTERVAL!
  scheduleJob(cron, (_: any) => {
    scraper.run().catch(err => bot.log(`[Scraper] ${err}`))
  })
  console.log("[Scheduler] initialized")

  /* BullMQ Queue Worker */
  const subscriptionsWorker = new Worker<string, void>(subscriptionQueueName, async (job) => {
    try {
      if (job.name === 'add') {
        await db.addSubscription(job.data)
      } else if (job.name === 'remove') {
        await db.removeSubscription(job.data)
      } else {
        console.error("Unknown job name:", job.name)
      }
    } catch (error) {
      console.error(error)
      bot.log("" + error)
    }
  }, { connection: { host: process.env.REDIS_HOST!, port: 6379 }, sharedConnection: true })

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

  }, { connection: { host: process.env.REDIS_HOST!, port: 6379 }, sharedConnection: true })

}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


/* when stopping your app
await scraper.deinit()
scheduler.stop()
*/