import { Provider } from "../provider"
import { Page, ElementHandle } from "puppeteer"
import { Appartment } from "../../appartment_type"
import { parse, HTMLElement } from 'node-html-parser'
import fetch from 'node-fetch'

export default class BDSProvider extends Provider {
  constructor() {
    super('bds', 'https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/')
  }

  async run(): Promise<Appartment[]> {
    const response = await fetch(this.url).then(response => response.text())
    const html = parse(response)

    const listings = html.querySelector(".immobilielist")

    if (!listings) {
      throw "[BDS] DIV with class 'immobilielist' does not exist"
    }

    const appartments: Appartment[] = []
    for (let listing of listings.querySelectorAll('.listitem')) {
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
        previewImageURL = "https://www.saga.hamburg" + previewImagePath
      } else { /* Don't care if preview was not found, as there might be none. Log it though */
        console.log(`[BDS] No preview image for appartment: ${listingURL}`)
      }

      const response = await fetch(listingURL.toString()).then(response => response.text())
      const html = parse(response)

      const properties = this.parseListingProperties(html)
      const floor = properties["Etage"]?.split(" ")[0].replace(".", "")

      const appartment: Appartment = {
        provider: 'bds',
        appartmentId: aptNumber,
        space: {
          roomCount: Number(roomCount.replace(",", ".")),
          area: Number(area.replace(",", ".")),
          floor: floor ? Number(floor) : null,
          balcony: properties["Balkon / Terrasse"] === 'Ja',
          terrace: properties["Balkon / Terrasse"] === 'Ja',
        },
        address: {
          street: street.replace(/,+$/, '').trim(),
          number: number.trim(),
          zipCode: zipCode.trim(),
          state: state.replace(/,+$/, '').trim(),
          district: district?.replace(/,+$/, '').trim(),
        },
        costs: {
          nettoCold: Number(properties['Netto-Kalt-Miete'].split(" ")[0].replace(",", ".")),
          operating: Number(properties['Betriebskosten'].split(" ")[0].replace(",", ".")),
          heating: Number(properties['Heiz­kosten'].split(" ")[0].replace(",", ".")),
          total: Number(properties['Gesamt­miete'].split(" ")[0].replace(",", "."))
        },
        availableFrom: properties["Verfügbar ab"],
        detailURL: listingURL.toString(),
        previewImageURL: previewImageURL
      }

      appartments.push(appartment)
    }

    return appartments
  }

  parseListingProperties(html: HTMLElement): { [key: string]: string } {
    const propertyList = html.querySelectorAll('tr')
    return Object.fromEntries(propertyList.map(row => [row.childNodes[0].innerText, row.childNodes[1].innerText]))
  }
}