import { Browser } from "puppeteer"
import { Inserat } from "../provider_type"

export abstract class Provider {
  url: string
  browser: Browser

  constructor(url: string, browser: Browser) {
    this.url = url
    this.browser = browser
  }

  abstract run(): Promise<Inserat[]>
}