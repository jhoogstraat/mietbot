import { Queue } from 'bullmq';
import 'dotenv/config'
import puppeteer from 'puppeteer'
import { Provider } from './provider.js';
import BDSProvider from './providers/bds_provider.js'
import SAGAProvider from './providers/saga_provider.js';

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

export default class Scraper {

  private constructor(browser: puppeteer.Browser, queue: Queue, providers: Provider[]) {
    this.browser = browser
    this.queue = queue
    this.providers = providers
  }

  browser: puppeteer.Browser
  queue: Queue
  providers: Provider[]

  static async init(scrapeQueueName: string): Promise<Scraper> {
    const browser = await puppeteer.launch()
    const scrapeQueue = new Queue(scrapeQueueName, { connection: { host: "127.0.0.1", port: 6379 }, sharedConnection: true })

    /* BDS */
    const bds = new BDSProvider()
    const saga = new SAGAProvider()

    return new Scraper(browser, scrapeQueue, [bds, saga])
  }

  async run() {
    for (const provider of this.providers) {
      let page: puppeteer.Page | null = null

      try {
        console.log(`[${provider.name}] Scraping...`)
        const appartments = await provider.run()
        const newListings = provider.filterNew(appartments)

        if (newListings.length > 0) {
          console.log(`[${provider.name}] new listings: ${newListings}`)
          this.queue.add(provider.name, newListings)
          page = await this.browser.newPage()
          for (let appartment of appartments) {
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
        await page?.close()
      }
    }
  }

  deinit(): Promise<void> {
    return this.browser.close()
  }
}


