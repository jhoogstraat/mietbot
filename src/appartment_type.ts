export type ProviderName = 'bds' | 'saga'

export type Address = {
  street: string,
  number: string
  zipCode: string,
  state: string,
  district?: string | null
}

export type Space = {
  roomCount: number,
  area: number,
  floor?: number | null,
  balcony?: boolean | null,
  terrace?: boolean | null
}

export type Costs = {
  nettoCold: number,
  operating: number,
  heating: number,
  total: number
}

export type Appartment = {
  provider: ProviderName,
  appartmentId: string,
  address: Address,
  space: Space,
  costs: Costs,
  availableFrom?: string | null,
  detailURL: string,
  previewImageURL?: string | null,
}