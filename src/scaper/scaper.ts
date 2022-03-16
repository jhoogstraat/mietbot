import { Queue } from 'bullmq';
import 'dotenv/config'
import * as puppeteer from 'puppeteer'
import { Provider } from './provider.js';
import BDSProvider from './providers/bds_provide.js'
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

export default class Scaper {

  private constructor(browser: puppeteer.Browser, queue: Queue, providers: Provider[]) {
    this.browser = browser
    this.queue = queue
    this.providers = providers
  }

  browser: puppeteer.Browser
  queue: Queue
  providers: Provider[]

  static async init(queueName: string): Promise<Scaper> {
    const browser = await puppeteer.launch()
    const queue = new Queue(queueName, { connection: { host: "localhost", port: 6379 }, sharedConnection: true })

    /* BDS */
    const bds = new BDSProvider()
    const saga = new SAGAProvider()

    return new Scaper(browser, queue, [bds, saga])
  }

  async run() {
    for (const provider of this.providers) {
      const page = await this.browser.newPage()
      const detailPage = await this.browser.newPage()

      try {
        console.log(`Running scraper for ${provider.name}`)
        const inserate = await provider.run(page, detailPage)
        if (inserate.length > 0) {
          this.queue.add('bds', inserate)
        }
      } catch (error) {
        console.log(error)
        this.queue.add('error', error)
      } finally {
        await page.close()
        await detailPage.close()
      }
    }
  }

  deinit(): Promise<void> {
    return this.browser.close()
  }
}


