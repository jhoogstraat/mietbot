import { Queue } from 'bullmq';
import 'dotenv/config'
import puppeteer from 'puppeteer'
import { ProviderName } from '../appartment_type.js';
import { Provider } from './provider.js';
import BDSProvider from './providers/bds_provider.js'
import SAGAProvider from './providers/saga_provider.js';

export default class Scraper {

  private constructor(queue: Queue, providers: Provider[]) {
    this.queue = queue
    this.providers = providers
  }

  queue: Queue
  providers: Provider[]

  static async init(scrapeQueueName: string, listings: { [key in ProviderName]: Set<string> }): Promise<Scraper> {
    const scrapeQueue = new Queue(scrapeQueueName, { connection: { host: process.env.REDIS_HOST!, port: 6379 }, sharedConnection: true })
    
    const bds = new BDSProvider(listings["bds"])
    const saga = new SAGAProvider(listings["saga"])

    return new Scraper(scrapeQueue, [bds, saga])
  }

  async run() {
    for (const provider of this.providers) {
      let browser: puppeteer.Browser | null = null

      try {
        console.log(`[${provider.name}] Scraping...`)

        const appartments = await provider.run()
        const newListings = provider.filterNew(appartments)

        if (newListings.length > 0) {
          console.log(`[${provider.name}] new listings: ${newListings.map(l => l.appartmentId)}`)

          this.queue.add(provider.name, newListings)

          if (!browser) {
            browser = await puppeteer.launch({
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
              ]
            })
          }
          
          const page = await browser.newPage()
          for (let appartment of newListings) {
            await page.goto(appartment.detailURL)
            const height = await page.evaluate(() => document.documentElement.scrollHeight)
            await page.pdf({ path: `listings/${appartment.provider}/${Buffer.from(appartment.appartmentId).toString('base64')}.pdf`, height: height + "px" })
          }
        } else {
          console.log(`[${provider.name}] no new listings`)
        }
      } catch (error) {
        console.log(error)
        this.queue.add('error', error)
      }
      finally {
        await browser?.close()
      }
    }
  }
}


