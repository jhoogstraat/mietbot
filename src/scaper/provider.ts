import { Page } from "puppeteer"
import { Appartment, ProviderName } from "../appartment_type"

export abstract class Provider {
  name: ProviderName
  url: string
  activeListings: Map<string, Appartment>
  initialized = false

  constructor(name: ProviderName, url: string) {
    this.name = name
    this.url = url
    this.activeListings = new Map()
  }

  abstract run(page: Page, detailPage: Page): Promise<Appartment[]>

  filterNew(appartments: Appartment[]): Appartment[] {
    if (!this.initialized) {
      this.updateCache(appartments)
      this.initialized = true
      console.log(`[${this.name}] Initialized with listings ${Array.from(this.activeListings.keys())}`)
      return []
    }

    const newListings = appartments.filter(apt => !this.activeListings.has(apt.appartmentId))

    this.updateCache(appartments)

    return newListings
  }

  updateCache(appartments: Appartment[]) {
    this.activeListings = new Map(appartments.map(apt => [apt.appartmentId, apt]))
  }
}