import { Provider } from "../provider"
import { Listing } from "../../listing"
import { parse, HTMLElement } from 'node-html-parser'
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'
import { formatRoomCount } from "../formatter"
import * as Formatter from '../formatter'

export default class SAGAProvider extends Provider {
  addressRegex: RegExp

  constructor(listings: Set<string>) {
    super('saga', 'https://www.saga.hamburg/immobiliensuche', listings)
    this.addressRegex = /\s*(?<street>.*) (?<number>.*)\n\s*(?<zipCode>\d*)\s*(?<state>\w*)\(?(?<district>\w*)?\s*/
  }

  async run(browser: puppeteer.Browser): Promise<Listing[]> {
    const response = await fetch(this.url).then(response => response.text())
    const html = parse(response)

    const htmlListings = html.querySelectorAll('.teaser3')

    if (!htmlListings) {
      throw "[SAGA] Something wrong. DIVs with class 'teaser3' does not exist"
    }

    const listings: Listing[] = []
    for (let listing of htmlListings) {
      const listingURL = 'https://www.saga.hamburg' + listing.querySelector('a')!.getAttribute('href')!

      const response = await fetch(listingURL).then(response => response.text())
      const html = parse(response)

      const properties = this.parseListingProperties(html)
      const address = html.querySelector('p.ft-semi')!.innerText.match(this.addressRegex)!.groups!

      let previewImageURL: string | null = null
      const previewImagePath = listing.querySelector('img')?.getAttribute('src')
      if (previewImagePath) {
        previewImageURL = "https://www.saga.hamburg" + previewImagePath
      } else { /* Don't care if preview was not found, as there might be none. Log it though */
        console.log(`[SAGA] No preview image for listing: ${listingURL}`)
      }

      listings.push({
        provider: 'saga',
        id: properties["Objektnummer"],
        category: 'apartment',
        space: {
          roomCount: formatRoomCount(properties["Zimmer"] as string),
          area: Formatter.formatNumber(properties["Wohnfläche ca."]),
          floor: properties['Etage'] === undefined ? null : Number(properties['Etage']),
          balcony: properties['Balkon'] === 'true',
          terrace: properties['Terrasse'] === 'true'
        },
        costs: {
          nettoCold: Formatter.formatNumber(properties['Netto-Kalt-Miete']),
          operating: Formatter.formatNumber(properties['Betriebskosten']),
          heating: Formatter.formatNumber(properties['Heizkosten']),
          total: Formatter.formatNumber(properties['Gesamtmiete'])
        },
        address: {
          street: address.street,
          number: address.number,
          zipCode: address.zipCode,
          state: address.state,
          district: address.district,
        },
        wbsRequired: null,
        availableFrom: properties['Verfügbar ab'],
        detailURL: listingURL.toString(),
        previewImageURL: previewImageURL,
        timestamp: new Date(),
      })
    }

    return listings
  }

  parseListingProperties(html: HTMLElement): { [key: string]: string } {
    const propertyList = html.querySelector('.dl-props')!
    const keys = propertyList.querySelectorAll('dt')
    const values = propertyList.querySelectorAll('dd')

    return keys.reduce<{ [key: string]: string }>((acc, key, i) => {
      if (values[i].innerText) {
        acc[key.innerText] = values[i].innerText
      } else {
        acc[key.innerText] = values[i].classNames == 'checked' ? 'true' : 'false'
      }
      return acc
    }, {})
  }
}