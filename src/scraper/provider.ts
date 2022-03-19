import { Appartment, ProviderName } from "../appartment_type"

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

  abstract run(): Promise<Appartment[]>

  filterNew(appartments: Appartment[]): Appartment[] {
    const newListings = appartments.filter(apt => !this.activeListings.has(apt.appartmentId))
    this.updateCache(appartments)
    return newListings
  }

  updateCache(appartments: Appartment[]) {
    this.activeListings = new Set(appartments.map(apt => apt.appartmentId))
  }
}