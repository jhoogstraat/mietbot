import { Page } from "puppeteer"
import { Inserat, ProviderName } from "../provider_type"

export abstract class Provider {
  name: ProviderName
  url: string

  constructor(name: ProviderName, url: string) {
    this.name = name
    this.url = url
  }

  abstract run(page: Page): Promise<Inserat[]>
}