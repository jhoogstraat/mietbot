import { Provider } from "../provider"
import { Appartment } from "../../appartment_type"
import puppeteer from 'puppeteer'
import * as Formatter from '../formatter'

export default class WalddoerferProvider extends Provider {

  constructor(listings: Set<string>) {
    super('walddoerfer', 'https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2227215/HP/immo.jsp', listings)
  }

  async run(browser: puppeteer.Browser): Promise<Appartment[]> {
    const page = await browser.newPage()
    await page.goto('https://hpm2.immosolve.eu/immosolve_presentation/pub/modern/2227215/HP/immo.jsp')

    // Deny Cookie Banner
    await page.waitForSelector('.uc-btn-deny').then(button => button?.click())

    // Wait for listings to load
    await page.waitForNetworkIdle()

    const listingsCount = await page.$eval('#totalObjects', count => Number(count.innerHTML))

    if (listingsCount === 0) {
      return []
    }

    const appartments: Appartment[] = []
    for (var i = 0; i < listingsCount; i++) {
      const listing = await page.$(`#immoObjectTemplate\\[${i}\\]`)
      await listing!.hover()
      await page.waitForTimeout(300)
      await page.mouse.down()
      await page.mouse.up()
      await page.waitForNetworkIdle()

      const id = await page.$eval('#labels\\.code', node => node.innerHTML)
      if (!id) {
        throw "[WALDDOERFER] Something wrong. Id could not be extracted"
      }

      appartments.push({
        provider: 'walddoerfer',
        appartmentId: id,
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
          floor: await page.$eval('#labels\\.etage', node => node.innerHTML).then(text => Number(text.match(/^\d+/)![0])),
          balcony: await page.$eval('#showDetail\\.descriptions\\.ausstattungsbeschreibung', node => node.innerHTML).then(text => text.includes("Balkon")),
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
        detailURL: this.url,
        previewImageURL: await page.$eval('.imageBig', (node) => node.getAttribute('src')),
        timestamp: new Date()
      })

      await page.$('.container-close').then(button => button?.click())
    }

    return appartments
  }

}