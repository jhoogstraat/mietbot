import { Provider } from "../provider"
import { Appartment } from "../../appartment_type"
import { parse, HTMLElement } from 'node-html-parser'
import fetch from 'node-fetch'

export default class SAGAProvider extends Provider {
  addressRegex: RegExp

  constructor() {
    super('saga', 'https://www.saga.hamburg/immobiliensuche')
    this.addressRegex = /\s*(?<street>.*) (?<number>.*)\n\s*(?<zipCode>\d*)\s*(?<state>\w*)\(?(?<district>\w*)?\s*/
  }

  async run(): Promise<Appartment[]> {
    const response = await fetch(this.url).then(response => response.text())
    const html = parse(response)

    const listings = html.querySelectorAll('.teaser3')

    if (!listings) {
      throw "[SAGA] Something wrong. DIVs with class 'teaser3' does not exist"
    }

    const appartments: Appartment[] = []
    for (let listing of listings) {
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
        console.log(`[SAGA] No preview image for appartment: ${listingURL}`)
      }

      appartments.push({
        provider: 'saga',
        appartmentId: properties["Objektnummer"],
        space: {
          roomCount: this.processRoomCount(properties["Zimmer"] as string),
          area: Number(properties["Wohnfläche ca."].split(" ")[0]),
          floor: properties['Etage'] === undefined ? undefined : Number(properties['Etage']),
          balcony: properties['Balkon'] === 'true',
          terrace: properties['Terrasse'] === 'true'
        },
        costs: {
          nettoCold: Number(properties['Netto-Kalt-Miete'].split(" ")[0].replace(",", ".")),
          operating: Number(properties['Betriebskosten'].split(" ")[0].replace(",", ".")),
          heating: Number(properties['Heizkosten'].split(" ")[0].replace(",", ".")),
          total: Number(properties['Gesamtmiete'].split(" ")[0].replace(",", "."))
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
        previewImageURL: previewImageURL
      })
    }

    return appartments
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

    // const properties = await detailPage.$eval('.dl-props', (node) => {
    //   const keys = Array.from(node.querySelectorAll('dt'), column => column.innerText)
    //   const values = Array.from(node.querySelectorAll('dd'), column => column.innerText)
    //   return keys.reduce<{ [key: string]: string }>((acc, key, i) => (acc[key] = values[i], acc), {})
    // })
  }

  processRoomCount(text: string): number {
    const splitted = text.split(" ")
    if (splitted.length == 1) {
      return Number(splitted)
    } else if (splitted.length == 2) {
      var number = Number(splitted[0])
      var partial = splitted[1].split("/")
      number += Number(partial[0]) / Number(partial[1])
      return number
    } else {
      throw "[SAGA] Invalid room count formatting"
    }
  }
}