import { Provider } from "../provider"
import { Page, ElementHandle } from "puppeteer"
import { Inserat } from "../../provider_type"

export default class BDSProvider extends Provider {
  constructor() {
    super('bds', 'https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/')
  }

  async run(page: Page, detailPage: Page): Promise<Inserat[]> {
    await page.goto(this.url)

    const immolist: ElementHandle<HTMLDivElement> | null = await page.waitForSelector(".immobilielist")

    if (!immolist) {
      throw "[BDS] Something wrong. DIV with class 'immobilielist' does not exist"
    }

    const immolistItems = await immolist.$$(".listitem")

    const inserate: Inserat[] = []

    for (let inseratData of immolistItems) {
      const detailURL = new URL('https://www.bds-hamburg.de' + await inseratData.$(".block a").then((node) => node?.evaluate((s) => s.getAttribute('href'))))
      const aptNumber = [...detailURL.searchParams].find((el) => el[0].includes("objektnr"))?.[1]

      if (!aptNumber) {
        console.log(`[BDS] The AptNumber could not be found! url: ${detailURL}`)
        continue
      }

      const previewURL = "https://www.bds-hamburg.de" + await inseratData.$eval(".image img", el => el.getAttribute("src"))
      const street = await inseratData?.$eval('.geo .strasse', el => el.innerHTML)
      const number = await inseratData?.$eval('.geo .hausnumber', el => el.innerHTML)
      const zipCode = await inseratData?.$eval('.geo .plz', el => el.innerHTML)
      const state = await inseratData?.$eval('.geo .ort', el => el.innerHTML)
      const district = await inseratData?.$eval('.geo .stadtteil', el => el.innerHTML)
      const roomCount = await inseratData?.$eval('.flaechen .anzahl_zimmer .wert', el => el.innerHTML)
      const area = await inseratData?.$eval('.flaechen .wohnflaeche .wert', el => el.innerHTML)
      const rentCold = await inseratData?.$eval('.miete .warmmiete', el => el.innerHTML)

      const inserat: Inserat = {
        provider: 'bds',
        id: aptNumber,
        space: {
          roomCount: Number(roomCount.replace(",", ".")),
          area: Number(area.replace(",", ".")),
          balcony: null,
        },
        address: {
          street: street.replace(/,+$/, '').trim(),
          number: number,
          zipCode: zipCode.trim(),
          state: state.replace(/,+$/, '').trim(),
          district: district.replace(/,+$/, '').trim(),
        },
        rentCold: Number(rentCold.split(" ")[0].replace(",", ".")),
        availableFrom: null,
        detailURL: detailURL.toString(),
        previewImageURL: previewURL
      }

      inserate.push(inserat)
    }

    return inserate
  }
}