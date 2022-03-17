import { Provider } from "../provider"
import { Page, ElementHandle } from "puppeteer"
import { Appartment } from "../../appartment_type"

export default class BDSProvider extends Provider {
  constructor() {
    super('bds', 'https://www.bds-hamburg.de/unser-angebot/wohnungsangebote/')
  }

  async run(page: Page, detailPage: Page): Promise<Appartment[]> {
    await page.goto(this.url)

    const immolist: ElementHandle<HTMLDivElement> | null = await page.waitForSelector(".immobilielist")

    if (!immolist) {
      throw "[BDS] Something wrong. DIV with class 'immobilielist' does not exist"
    }

    const immolistItems = await immolist.$$(".listitem")

    const appartments: Appartment[] = []

    for (let appartmentData of immolistItems) {
      const detailURL = new URL('https://www.bds-hamburg.de' + await appartmentData.$(".block a").then((node) => node?.evaluate((s) => s.getAttribute('href'))))
      const aptNumber = [...detailURL.searchParams].find((el) => el[0].includes("objektnr"))![1]
      const previewURL = "https://www.bds-hamburg.de" + await appartmentData.$eval(".image img", el => el.getAttribute("src"))
      const street = await appartmentData?.$eval('.geo .strasse', el => el.innerHTML)
      const number = await appartmentData?.$eval('.geo .hausnumber', el => el.innerHTML)
      const zipCode = await appartmentData?.$eval('.geo .plz', el => el.innerHTML)
      const state = await appartmentData?.$eval('.geo .ort', el => el.innerHTML)
      const district = await appartmentData?.$eval('.geo .stadtteil', el => el.innerHTML)
      const roomCount = await appartmentData?.$eval('.flaechen .anzahl_zimmer .wert', el => el.innerHTML)
      const area = await appartmentData?.$eval('.flaechen .wohnflaeche .wert', el => el.innerHTML)
      const rentCold = await appartmentData?.$eval('.miete .warmmiete', el => el.innerHTML)

      const appartment: Appartment = {
        provider: 'bds',
        appartmentId: aptNumber,
        space: {
          roomCount: Number(roomCount.replace(",", ".")),
          area: Number(area.replace(",", ".")),
          balcony: null,
          floor: -1,
          terrace: null,
        },
        address: {
          street: street.replace(/,+$/, '').trim(),
          number: number,
          zipCode: zipCode.trim(),
          state: state.replace(/,+$/, '').trim(),
          district: district.replace(/,+$/, '').trim(),
        },
        costs: {
          nettoCold: Number(rentCold.split(" ")[0].replace(",", ".")),
          operating: -1,
          heating: -1,
          total: -1
        },
        availableFrom: null,
        detailURL: detailURL.toString(),
        previewImageURL: previewURL
      }

      appartments.push(appartment)
    }

    return appartments
  }
}