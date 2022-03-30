export type ProviderName = 'bds' | 'saga' | 'walddoerfer' | 'kaifu' | 'bve' | 'dhu' | 'hbh'

export type Category = 'parking' | 'apartment'

export type Address = {
  street: string,
  number: string | null,
  zipCode: string | null,
  state: string,
  district: string | null
}

export type Space = {
  roomCount: number,
  area: number,
  floor: number | null,
  balcony: boolean | null,
  terrace: boolean | null
}

export type Costs = {
  nettoCold: number,
  operating: number | null,
  heating: number | null,
  total: number
}

export type Listing = {
  provider: ProviderName,
  id: string,
  category: Category,
  address: Address,
  space: Space,
  costs: Costs,
  wbsRequired: boolean | null,
  availableFrom: string | null,
  detailURL: string, // Unique(!) url to listing
  previewImageURL: string | null,
  timestamp: Date
}