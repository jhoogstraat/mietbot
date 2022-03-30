import { Listing, ProviderName } from "../listing"
import { Browser } from "puppeteer"
import fetch from 'node-fetch'

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

  async queryDistrict(zipCode: string): Promise<string | null> {
    try {
      const response = await fetch(`api.zippopotam.us/de/${zipCode}`).then(response => response.json()) as any
      return response.places[response.places.length - 1]["place name"] ?? null
    } catch (error) {
      console.log(error)
      return null
    }
  }
}