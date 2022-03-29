import { Provider } from "../provider"
import { Listing } from "../../listing"
import puppeteer from 'puppeteer'
import * as Formatter from '../formatter'

export default class DHUProvider extends Provider {

  constructor(listings: Set<string>) {
    super('dhu', 'https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2223228/HP/immo.jsp', listings)
  }

  async run(browser: puppeteer.Browser): Promise<Listing[]> {
    const page = await browser.newPage()
    await page.goto(this.url)

    // Deny Cookie Banner
    await page.waitForSelector('.uc-btn-deny').then(button => button?.click())

    // Wait for listings to load
    await page.waitForNetworkIdle()

    const listingsCount = await page.$eval('#totalObjects', count => Number(count.innerHTML))

    if (listingsCount === 0) {
      return []
    }

    const listings: Listing[] = []
    for (var i = 0; i < listingsCount; i++) {
      const listing = await page.$(`#immoObjectTemplate\\[${i}\\]`)
      await listing!.hover()
      await page.waitForTimeout(300)
      await page.mouse.down()
      await page.mouse.up()
      await page.waitForNetworkIdle()

      const id = await page.$eval('#labels\\.code', node => node.innerHTML)
      if (!id) {
        throw "[DHU] Something wrong. Id could not be extracted"
      }

      listings.push({
        provider: 'dhu',
        id: id,
        category: 'apartment',
        address: {
          street: await page.$eval('#address\\.labels\\.strasse', node => node.innerHTML),
          number: await page.$eval('#address\\.labels\\.hausnummer', node => node.innerHTML),
          zipCode: await page.$eval('#address\\.labels\\.plz', node => node.innerHTML),
          state: await page.$eval('#address\\.labels\\.ort', node => node.innerHTML),
          district: await page.$eval('#address\\.labels\\.searchRegion', node => node.innerHTML).catch(() => null)
        },
        space: {
          roomCount: await page.$eval('#labels\\.anzahlZimmer', node => node.innerHTML).then(text => Formatter.formatRoomCount(text)),
          area: await page.$eval('#labels\\.wohnflaeche', node => node.innerHTML).then(text => Formatter.formatNumber(text)),
          floor: await page.$eval('#labels\\.etage', node => node.innerHTML).then(text => Formatter.formatFloor(text)),
          balcony: await page.$eval('#showDetail\\.descriptions\\.ausstattungsbeschreibung', node => node.innerHTML).then(text => this.log(text)),
          terrace: await page.$eval('#showDetail\\.descriptions\\.ausstattungsbeschreibung', node => node.innerHTML).then(text => text.includes("Terrasse"))
        },
        costs: {
          nettoCold: await page.$eval('#labels\\.mietpreis', node => node.innerHTML).then(text => Formatter.formatNumber(text)),
          operating: await page.$eval('#labels\\.betriebskosten', node => node.innerHTML).then(text => Formatter.formatNumber(text)),
          heating: await page.$eval('#labels\\.heizkosten', node => node.innerHTML).then(text => Formatter.formatNumber(text)).catch(() => null),
          total: await page.$eval('#labels\\.monatlGesamtkosten', node => node.innerHTML).then(text => Formatter.formatNumber(text)),
        },
        wbsRequired: await page.$eval('#labels\\.wohnberechtigungsschein', (node) => node.innerHTML === 'Ja').catch(() => null),
        availableFrom: await page.$eval('#labels\\.availableStart', (node) => node.innerHTML).catch(() => null),
        detailURL: this.url + "?rng=" + Math.random(), // <- Make unique
        previewImageURL: await page.$eval('.imageBig', (node) => node.getAttribute('src')),
        timestamp: new Date()
      })

      await page.$('.container-close').then(button => button?.click())
    }

    return listings
  }

  log(text: string): boolean {
      console.log(text)
      return text.includes("Balkon")
  }
}