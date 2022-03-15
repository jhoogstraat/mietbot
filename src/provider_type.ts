export type ProviderName = 'bds' | 'saga'

export type Address = {
  street: string,
  number: string
  zipCode: string,
  state: string,
  district: string | null
}

export type Space = {
  roomCount: number,
  area: number,
  balcony: boolean | null
}

export type Inserat = {
  provider: ProviderName,
  id: string,
  address: Address,
  space: Space,
  rentCold: number,
  availableFrom: string | null,
  detailURL: string,
  previewImageURL: string | null,
}