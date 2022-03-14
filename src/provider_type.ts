export type ProviderName = 'bds'

export type Address = {
  street: string,
  number: string
  postalCode: string
  district: string
}

export type Inserat = {
  provider: ProviderName,
  id: string,
  aptNumber: string | null | undefined,
  address: Address,
  roomCount: number,
  area: number,
  rentCold: number,
  detailURL: string
}