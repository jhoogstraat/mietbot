import { Provider } from "../provider"
import { Address, Listing } from "../../listing"
import dist, { parse, HTMLElement } from 'node-html-parser'
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'
import { formatRoomCount } from "../formatter"
import * as Formatter from '../formatter'

export default class HBHProvider extends Provider {
  addressRegex = /\s*(?<street>.*)\s+(?<number>.*)\n\s*(?<zipCode>\d*)\s*(?<state>[^(]*)\(?(?<district>[^)]*)?/

  constructor(listings: Set<string>) {
    super('hbh', 'https://www.hanseatische.de/de/wohnungsangebote', listings)
  }

  async run(browser: puppeteer.Browser): Promise<Listing[]> {
    const response = await fetch(this.url).then(response => response.text())
    const html = parse(response)

    const htmlListings = html.querySelectorAll('.v_body.group')

    if (!htmlListings) {
      throw "[HBH] Something wrong. DIVs with class '.v_body.group' does not exist"
    }

    const listings: Listing[] = []
    for (let listing of htmlListings) {
      const listingURL = 'https://www.hanseatische.de' + listing.querySelector('a')!.getAttribute('href')!

      const response = await fetch(listingURL).then(response => response.text())
      const html = parse(response)

      const properties = this.parseListingProperties(html)
      console.log(properties)
      let previewImageURL: string | null = null
      const previewImagePath = listing.querySelector('.v_bild img')?.getAttribute('srcset')
      if (previewImagePath) {
        previewImageURL = "https://www.hanseatische.de" + previewImagePath
      } else { /* Don't care if preview was not found, as there might be none. Log it though */
        console.log(`[HBH] No preview image for listing: ${listingURL}`)
      }

      listings.push({
        provider: 'hbh',
        id: properties["Wohnungs&shy;nummer"],
        category: 'apartment',
        space: {
          roomCount: formatRoomCount(properties["Zimmer"]),
          area: Formatter.formatNumber(properties["Fläche"]),
          floor: properties['Etage'] === undefined ? null : Number(properties['Etage']),
          balcony: null,
          terrace: null
        },
        costs: {
          nettoCold: Formatter.formatNumber(properties['Nettokaltmiete']),
          operating: null,
          heating: null,
          total: Formatter.formatNumber(properties['Nettokaltmiete']) + Formatter.formatNumber(properties['Nebenkosten inkl. Heizkosten'])
        },
        address: {
          street: properties['Straße'],
          number: null,
          zipCode: null,
          state: properties['Ort'],
          district: properties['Stadtteil'],
        },
        wbsRequired: null,
        availableFrom: null,
        detailURL: listingURL.toString(),
        previewImageURL: previewImageURL,
        timestamp: new Date(),
      })
    }

    return listings
  }

  parseListingProperties(node: HTMLElement): { [key: string]: string } {
    const keys = node.querySelectorAll('.v_felder_lh')
    const values = node.querySelectorAll('.v_felder_rh')

    return keys.reduce<{ [key: string]: string }>((acc, key, i) => {
      acc[key.innerText] = values[i].innerText
      return acc
    }, {})
  }
}