import { Queue } from 'bullmq';
import 'dotenv/config'
import { launch, Browser } from 'puppeteer'
import { Provider } from './provider.js';
import BDSProvider from './providers/bds_provide.js'

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

  private constructor(browser: Browser, queue: Queue, providers: Provider[]) {
    this.browser = browser
    this.queue = queue
    this.providers = providers
  }

  browser: Browser
  queue: Queue
  providers: Provider[]

  static async init(): Promise<Scaper> {
    const browser = await launch()

    const queue = new Queue('scaping')

    /* BDS */
    const bds = new BDSProvider(browser)

    return new Scaper(browser, queue, [bds])
  }

  async deinit() {
    await this.browser.close();
  }

  async run() {
    for (const provider of this.providers) {
      await provider.run()
    }
  }
}


