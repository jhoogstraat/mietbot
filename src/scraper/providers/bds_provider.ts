import { Provider } from "../provider"
import { Listing } from "../../listing"
import { parse, HTMLElement } from 'node-html-parser'
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'
import * as Formatter from '../formatter'

export default class BDSProvider extends Provider {
  constructor(listings: Set<string>) {
    super('bds', 'https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/', listings)
  }

  async run(browser: puppeteer.Browser): Promise<Listing[]> {
    const response = await fetch(this.url).then(response => response.text())
    const html = parse(response)

    const htmlListings = html.querySelector(".immobilielist")

    if (!htmlListings) {
      throw "[BDS] DIV with class 'immobilielist' does not exist"
    }

    const listings: Listing[] = []
    for (let listing of htmlListings.querySelectorAll('.listitem')) {
      const listingURL = new URL('https://www.bds-hamburg.de' + await listing.querySelector(".block a")!.getAttribute('href')!)

      const aptNumber = [...listingURL.searchParams].find((el) => el[0].includes("objektnr"))![1]
      const street = listing.querySelector('.geo .strasse')!.innerText
      const number = await listing.querySelector('.geo .hausnumber')!.innerText
      const zipCode = await listing.querySelector('.geo .plz')!.innerText
      const state = await listing.querySelector('.geo .ort')!.innerText
      const district = await listing.querySelector('.geo .stadtteil')?.innerText
      const roomCount = await listing.querySelector('.flaechen .anzahl_zimmer .wert')!.innerText
      const area = await listing.querySelector('.flaechen .wohnflaeche .wert')!.innerText

      let previewImageURL: string | null = null
      const previewImagePath = listing.querySelector(".image img")?.getAttribute("src")
      if (previewImagePath) {
        previewImageURL = "https://www.bds-hamburg.de" + previewImagePath
      } else { /* Don't care if preview was not found, as there might be none. Log it though */
        console.log(`[BDS] No preview image for listing: ${listingURL}`)
      }

      const response = await fetch(listingURL.toString()).then(response => response.text())
      const html = parse(response).removeWhitespace()

      const properties = this.parseListingProperties(html)
      const floor = properties["Etage"]?.match(/\d+/)?.at(0)

      listings.push({
        provider: 'bds',
        id: aptNumber,
        category: 'apartment',
        space: {
          roomCount: Formatter.formatNumber(roomCount),
          area: Formatter.formatNumber(area),
          floor: floor ? Number(floor) : null,
          balcony: properties["Balkon / Terrasse"] === 'Ja',
          terrace: properties["Balkon / Terrasse"] === 'Ja',
        },
        address: {
          street: street.replace(/,$/, '').trim(),
          number: number.trim(),
          zipCode: zipCode.trim(),
          state: state.replace(/,$/, '').trim(),
          district: district?.replace(/,$/, '').trim() ?? null,
        },
        costs: {
          nettoCold: Formatter.formatNumber(properties['Netto-Kalt-Miete']),
          operating: Formatter.formatNumber(properties['Betriebs­kosten']),
          heating: Formatter.formatNumber(properties['Heiz­kosten']),
          total: Formatter.formatNumber(properties['Gesamt­miete'])
        },
        wbsRequired: properties["Wohn­berechti­gungs­schein"] === "Ja",
        availableFrom: properties["Verfügbar ab"],
        detailURL: listingURL.toString(),
        previewImageURL: previewImageURL,
        timestamp: new Date()
      })
    }

    return listings
  }

  parseListingProperties(html: HTMLElement): { [key: string]: string } {
    const propertyList = html.querySelectorAll('tr')
    return Object.fromEntries(propertyList.map(row => [row.childNodes[0].text.trim(), row.childNodes[1].text.trim()]))
  }
}
