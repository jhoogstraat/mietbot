import { Provider } from "../provider"
import * as puppeteer from "puppeteer"
import { Inserat } from "../../provider_type"

export default class BDSProvider extends Provider {
  constructor(browser: puppeteer.Browser) {
    super('file:///home/jh/Downloads/Wohnungsangebote%20-%20BDS.html', browser)
  }

  async run(): Promise<Inserat[]> {
    const page = await this.browser.newPage()

    await page.goto(this.url)

    const immolist: puppeteer.ElementHandle<HTMLDivElement> | null = await page.waitForSelector(".immobilielist")

    if (!immolist) {
      throw "[BDS] Something wrong. DIV with class 'immobilielist' does not exist"
    }

    const immolistItems = await immolist.$$(".listitem")

    const inserate: Inserat[] = []

    for (let inseratData of immolistItems) {
      const detailURL = new URL('https://www.bds-hamburg.de' + await inseratData.$(".block a").then((node) => node?.evaluate((s) => s.getAttribute('href'))))
      const hash = detailURL.searchParams.get('cHash')

      if (!hash) {
        throw "[BDS] Something wrong! Could not extract cHash from detail URL"
      }

      await inseratData.screenshot({ path: hash + '_preview.jpg' })

      const aptNumber = [...detailURL.searchParams].find((el) => el[0].includes("objektnr"))?.[1]
      const street = await inseratData?.$('.geo .strasse').then((street) => street?.evaluate((s) => s.innerHTML))
      const number = await inseratData?.$('.geo .hausnumber').then((number) => number?.evaluate((s) => s.innerHTML))
      const postalCode = await inseratData?.$('.geo .plz').then((postalCode) => postalCode?.evaluate((s) => s.innerHTML))
      const district = await inseratData?.$('.geo .stadtteil').then((district) => district?.evaluate((s) => s.innerHTML))
      const roomCount = await inseratData?.$('.flaechen .anzahl_zimmer .wert').then((roomCount) => roomCount?.evaluate((s) => s.innerHTML))
      const area = await inseratData?.$('.flaechen .wohnflaeche .wert').then((area) => area?.evaluate((s) => s.innerHTML))
      const rentCold = await inseratData?.$('.miete .warmmiete').then((rent) => rent?.evaluate((s) => s.innerHTML))

      if (street && number && postalCode && district && roomCount && area && rentCold) {
        const inserat: Inserat = {
          provider: 'bds',
          id: hash,
          aptNumber: aptNumber,
          address: {
            street: street,
            number: number,
            postalCode: postalCode,
            district: district,
          },
          roomCount: Number(roomCount.replace(",", ".")),
          area: Number(area.replace(",", ".")),
          rentCold: Number(rentCold.split(" ")[0].replace(",", ".")),
          detailURL: detailURL.toString()
        }

        inserate.push(inserat)
      } else {
        throw `[BDS] Any of the required fields could not be retrieved! id: ${hash}`
      }
    }

    return inserate
  }
}