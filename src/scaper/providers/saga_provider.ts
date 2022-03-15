import { Provider } from "../provider"
import { Page, ElementHandle } from "puppeteer"
import { Inserat } from "../../provider_type"

export default class SAGAProvider extends Provider {
  constructor() {
    super('saga', 'https://www.saga.hamburg/immobiliensuche')
  }

  async run(page: Page, detailPage: Page): Promise<Inserat[]> {
    await page.goto(this.url)

    const immolistItems: ElementHandle<HTMLDivElement>[] | null = await page.$$(".teaser3")

    if (!immolistItems) {
      throw "[SAGA] Something wrong. DIVs with class 'teaser3' does not exist"
    }

    const inserate: Inserat[] = []
    for (let item of immolistItems) {
      const detailURL = new URL('https://www.saga.hamburg' + await item.$eval("a", el => el.getAttribute('href')))
      const previewURL = "https://www.saga.hamburg" + await item.$eval("img", el => el.getAttribute("src"))
      const aptNumber = detailURL.pathname.split("/").pop()!

      await detailPage.goto(detailURL.toString())

      const address = (await detailPage.$eval<string>("p.ft-semi", (el) => (el as HTMLParagraphElement).innerText)).replace("\n", " ").split(" ")
      const inseratPropList = await detailPage.$$eval(".dl-props dt, .dl-props dd", el => el.map(el => el.innerHTML))

      if (!inseratPropList) {
        throw "[SAGA] Something wrong. Element with class '.dl-props' not found"
      }

      const lol: { [key: string]: string } = {}
      lol['test'] = 123
      const test: { [key: string]: string } = inseratPropList.reduce((acc, v, i) => {
        // Map even items as properties and odd items as values to prev property.
        i % 2 === 0 ? acc[v] = null : acc[list[i - 1]] = v
        return acc
      }, {});


      if (address.length == 4 && roomCount && area && rentCold) {
        const inserat: Inserat = {
          provider: 'bds',
          id: aptNumber,
          space: {
            roomCount: Number(roomCount.replace(",", ".")),
            area: Number(area.replace(",", ".")),
            balcony: null,
          },
          address: {
            street: address[0].trim(),
            number: address[1].trim(),
            zipCode: address[2].trim(),
            state: address[3].trim(),
            district: null
          },
          rentCold: Number(rentCold.split(" ")[0].replace(",", ".")),
          availableFrom: null,
          detailURL: detailURL.toString(),
          previewImageURL: previewURL
        }

        inserate.push(inserat)
      } else {
        throw `[BDS] Any of the required fields could not be retrieved!`
      }
    }

    return inserate
  }
}