import { Provider } from "../provider"
import { Address, Costs, Listing, Space } from "../../listing"
import { parse, HTMLElement } from 'node-html-parser'
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'
import * as Formatter from '../formatter'

export default class BVEProvider extends Provider {
  constructor(listings: Set<string>) {
    super('bve', 'https://www.bve.de/wohnen-beim-bve/wohnungsbestand/wohnungsangebote/', listings)
  }

  async run(browser: puppeteer.Browser): Promise<Listing[]> {
    const response = await fetch(this.url).then(response => response.text())
    const html = parse(response)

    const listings: Listing[] = []
    for (let listing of html.querySelectorAll('.wohnungsangebotBox')) {
      const listingURL = new URL('https://www.bve.de' + await listing.querySelector("a")!.getAttribute('href')!)
      const aptNumber = [...listingURL.searchParams.values()].join()

      const response = await fetch(listingURL.toString()).then(response => response.text())
      const html = parse(response).removeWhitespace()
      const tables = html.querySelectorAll('.wohnungsangebotContainer > h3')

      let address!: Address
      let space!: Space
      let costs!: Costs

      for (const element of tables) {
        if (element.innerText === 'Adresse und Lage') {
          const table = element.nextElementSibling
          space = this.parseSpace(table.innerText)
          address = this.parseAddress(table.innerText)
          if (!address.district) {
            address.district = await this.queryDistrict(address.zipCode!)
          }
        } else if (element.innerText === 'Monatliche Kosten') {
          const table = element.nextElementSibling
          costs = this.parseCosts(table)
        } else if (element.innerText === 'Genossenschaftsanteile') {

        } else if (element.innerText === 'Wohnungsbeschreibung') {
          const table = element.nextElementSibling
          space.balcony = table.innerText.includes("Balkon")
          space.terrace = table.innerText.includes("Terrasse")
        }
      }

      const title = html.querySelector('.wohnanlageContent > h2')?.innerText!
      const availableFrom = title.match(/\d{2}\.\d{2}\.?\d{4}?/)?.at(0) ?? null

      let previewImageURL: string | null = null
      const previewImagePath = listing.querySelector("img")?.getAttribute("src")
      if (previewImagePath) {
        previewImageURL = "https://www.bve.de" + previewImagePath
      } else { /* Don't care if preview was not found, as there might be none. Log it though */
        console.log(`[BVE] No preview image for listing: ${listingURL}`)
      }

      listings.push({
        provider: 'bve',
        id: aptNumber,
        category: 'apartment',
        space,
        address,
        costs,
        wbsRequired: null,
        availableFrom,
        detailURL: listingURL.toString(),
        previewImageURL: previewImageURL,
        timestamp: new Date()
      })
    }

    return listings
  }

  parseSpace(text: string): Space {
    const rooms = text.match(/(\d( \d\/\d)?) Zimmer/)![1]
    const area = text.match(/([0-9,]*) m²/)![1]
    const floor = Formatter.formatNumber(text.match(/(\d*).{0,2}OG/)![1])

    return {
      roomCount: Formatter.formatRoomCount(rooms),
      area: Formatter.formatNumber(area),
      floor: floor,
      balcony: false,
      terrace: false,
    }
  }

  parseAddress(text: string): Address {
    const regex = /(?<street>\D*) (?<number>.*), (?<zipCode>\d*) (?<state>\D*),/
    const match = text.match(regex)!.groups!

    return {
      street: match.street.trim(),
      number: match.number.trim(),
      zipCode: match.zipCode.trim(),
      state: match.state.trim(),
      district: null,
    }
  }

  parseCosts(table: HTMLElement): Costs {
    let nettoCold = null
    let operating = null
    let heating = null
    let total = null

    for (const row of table.querySelectorAll('.table-row')) {
      const cells = row.querySelectorAll('.table-cell')

      switch (cells[0].innerText) {
        case 'Nutzungsentgelt kalt:':
          nettoCold = Formatter.formatNumber(cells[1].innerText)
          break
        case 'Betriebskosten-Vorauszahlung:':
          operating = Formatter.formatNumber(cells[1].innerText)
          break
        case 'Heizkosten-Vorauszahlung:':
          heating = Formatter.formatNumber(cells[1].innerText)
          break
        case 'Gesamtnutzungsentgelt:':
          total = Formatter.formatNumber(cells[1].innerText)
          break
      }
    }
    
    if (nettoCold === null || total === null) {
      throw ['[BVE] Netto-Cold or total costs missing']
    }

    return {
      nettoCold,
      operating,
      heating,
      total,
    }
  }
}
