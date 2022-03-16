import { Provider } from "../provider"
import { Page, ElementHandle } from "puppeteer"
import { Inserat } from "../../provider_type"

export default class SAGAProvider extends Provider {
  addressRegex: RegExp

  constructor() {
    super('saga', 'https://www.saga.hamburg/immobiliensuche')
    this.addressRegex = /(?<street>.*) (?<number>.*)\n(?<zipCode>\d*) (?<state>\w*)\(?(?<district>\w*)?/
  }

  async run(page: Page, detailPage: Page): Promise<Inserat[]> {
    await page.goto(this.url)

    const immolistItems: ElementHandle<HTMLDivElement>[] | null = await page.$$(".teaser3")

    if (!immolistItems) {
      throw "[SAGA] Something wrong. DIVs with class 'teaser3' does not exist"
    }

    const inserate: Inserat[] = []
    for (let item of immolistItems) {
      const detailURL = 'https://www.saga.hamburg' + await item.$eval("a", el => el.getAttribute('href'))

      let previewImageURL: string | null = null
      try {
        const previewImagePath = await item.$eval("img", el => el.getAttribute("src"))
        previewImageURL = "https://www.saga.hamburg" + previewImagePath
      } catch {
        /* Don't care if preview was not found, as there might be none. Log it though */
        console.log(`[SAGA] There was not preview image for Inserat: ${detailURL}`)
      }

      await detailPage.goto(detailURL)

      const inseratPropList = await detailPage.$$eval(".dl-props dt, .dl-props dd", el => el.map(el => el.innerHTML))
      const inseratProperties = inseratPropList.reduce((acc, v, i) => {
        // Map even items as properties and odd items as values to prev property.
        if (i % 2 !== 0) {
          acc[inseratPropList[i - 1]] = v
        }
        return acc
      }, {} as { [key: string]: string })

      const terraceAndBalcony = await detailPage.$$eval(".dl-props dd.checked, .dl-props dd.crossed", el => el.map(el => el.className == 'checked'))

      const aptNumber = inseratProperties["Objektnummer"]
      const roomCount = inseratProperties["Zimmer"]
      const area = inseratProperties["Wohnfläche ca."]
      const floor = inseratProperties['Etage']
      const costsCold = inseratProperties['Netto-Kalt-Miete']
      const costsOperating = inseratProperties['Betriebskosten']
      const costsHeating = inseratProperties['Heizkosten']
      const costsTotal = inseratProperties['Gesamtmiete']

      const addressText = await detailPage.$eval("p.ft-semi", (el) => (el as HTMLParagraphElement).innerText)
      const address = addressText.match(this.addressRegex)!.groups!

      const inserat: Inserat = {
        provider: 'saga',
        id: aptNumber,
        space: {
          roomCount: this.processRoomCount(roomCount),
          area: Number(area.split(" ")[0]),
          floor: Number(floor),
          balcony: terraceAndBalcony[1],
          terrace: terraceAndBalcony[0]
        },
        costs: {
          nettoCold: Number(costsCold.split(" ")[0].replace(",", ".")),
          operating: Number(costsOperating.split(" ")[0].replace(",", ".")),
          heating: Number(costsHeating.split(" ")[0].replace(",", ".")),
          total: Number(costsTotal.split(" ")[0].replace(",", "."))
        },
        address: {
          street: address.street,
          number: address.number,
          zipCode: address.zipCode,
          state: address.state,
          district: address.district
        },
        availableFrom: null,
        detailURL: detailURL.toString(),
        previewImageURL: previewImageURL
      }

      inserate.push(inserat)
    }

    return inserate
  }

  processRoomCount(formatted: string): number {
    const splitted = formatted.split(" ")
    if (splitted.length == 1) {
      return Number(splitted)
    } else if (splitted.length == 2) {
      var number = Number(splitted[0])
      var partial = splitted[1].split("/")
      number += Number(partial[0]) / Number(partial[1])
      return number
    } else {
      throw "Invalid room count formatting"
    }
  }
}