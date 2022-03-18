import 'dotenv/config'
import { scheduleJob } from "node-schedule"
import { Worker } from "bullmq"

import { Appartment } from "./appartment_type"
import Scraper from "./scraper/scraper"
// import Database from "./db/database"
// import DiscordBot from "./discord-connector/bot"

async function main() {
  console.log("Booting...")

  /* Database */
  // const db = await Database.init()
  // console.log("[Database] initialized")

  /* Scraper */
  const scraperQueueName = "scrape_queue"
  const scraper = await Scraper.init(scraperQueueName)
  console.log("[Scraper] initialized")

  /* Discord Bot */
  // const subscriptions = await db.getSubscriptions()
  // const bot = await DiscordBot.init(subscriptions)

  /* Scheduler */
  /* https://www.freeformatter.com/cron-expression-generator-quartz.html */
  /* At second :00, every 5 minutes starting at minute :00, every hour between 06am and 18pm, every day between Monday and Friday, every month */
  const cron = "0 0/5 6-18 ? * MON-FRI *"
  const every5Minutes = '0 */5 * * * *'
  const every5Seconds = '*/5 * * * * *'
  scheduleJob(every5Seconds, (date) => {
    scraper.run() //.catch(err => bot.log(`[Scraper] ${err}`))
  })
  console.log("[Scheduler] initialized")

  /* BullMQ Queue Worker */
  // const databaseWorker = new Worker<Appartment[], void>(scraperQueueName, async (job) => {
  //   try {
  //     if (job.name != 'error')
  //       await db.update(job.data)
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }, { connection: { host: "localhost", port: 6379 }, sharedConnection: true })

  // const discordWorker = new Worker<Appartment[], void>(scraperQueueName, async (job) => {
  //   try {
  //     if (job.name == 'error') {
  //       console.error(job.data)
  //       await bot.log("" + job.data)
  //     }
  //     else {
  //       await bot.post(job.data)
  //     }
  //   } catch (error) {
  //     console.error(error)
  //     await bot.log("" + error)
  //   }
  // }, { connection: { host: "localhost", port: 6379 }, sharedConnection: true })

  const debugWorker = new Worker<Appartment[], void>(scraperQueueName, async (job) => {
    console.log(job.name, job.data)
  }, { connection: { host: "127.0.0.1", port: 6379 }, sharedConnection: true })

}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


/* when stopping your app
await scraper.deinit()
scheduler.stop()
*/