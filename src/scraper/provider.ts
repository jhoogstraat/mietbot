import { Listing, ProviderName } from "../listing"
import { Browser } from "puppeteer"

export abstract class Provider {
  name: ProviderName
  url: string
  activeListings: Set<string>

  constructor(name: ProviderName, url: string, listings: Set<string> = new Set()) {
    this.name = name
    this.url = url
    this.activeListings = listings
    console.log(`[${name}] Initialized with listings:`, Array.from(listings))
  }

  abstract run(browser: Browser): Promise<Listing[]>

  filterNew(listings: Listing[]): Listing[] {
    const newListings = listings.filter(apt => !this.activeListings.has(apt.id))
    this.updateCache(listings)
    return newListings
  }

  updateCache(apartments: Listing[]) {
    this.activeListings = new Set(apartments.map(apt => apt.id))
  }
}