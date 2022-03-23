import { ColorResolvable, MessageEmbed } from "discord.js";
import { Listing, Costs, ProviderName, Space, Address } from "../listing";

export default buildEmbed

const providerColorMap: Map<ProviderName, ColorResolvable> = new Map([
  ["bds", "#ed8b00"],
  ["saga", "#55bed5"],
  ["walddoerfer", "#005D43"],
  ["kaifu", "#a0102b"]
])

function buildEmbed(listing: Listing): MessageEmbed {
  const embed = new MessageEmbed()
    .setURL(listing.detailURL)
    .setColor(providerColorMap.get(listing.provider)!)

  switch (listing.category) {
    case 'apartment': addApartmentFields(listing, embed)
    case 'parking': addParkingSpaceFields(listing, embed)
  }

  if (listing.previewImageURL) {
    embed.setImage(listing.previewImageURL)
  }

  if (listing.availableFrom) {
    embed.addField("Verfügbar ab", listing.availableFrom)
  }

  embed.addField("Anbieter", listing.provider)

  return embed
}

function addParkingSpaceFields(listing: Listing, embed: MessageEmbed) {
  embed
    .setTitle(`Stellplatz in ${listing.address.district ?? listing.address.zipCode}`)
    .addField("Mtl. Preis", `${listing.costs.total} €`)
    .addField("Addresse", formatAddress(listing.address))
}

function addApartmentFields(listing: Listing, embed: MessageEmbed) {
  embed
    .setTitle(`${listing.space.roomCount} Zimmer in ${listing.address.district ?? listing.address.zipCode}`)
    .addField("Wohnfläche", `ca. ${listing.space.area} m²`, true)
    .addField("Etage", listing.space.floor?.toString() ?? "Keine Angabe", true)
    .addField("Balkon / Terrasse", formatBalconyAndTerrace(listing.space), true)
    // .addField("Terrasse", formatBoolean(apartment.space.terrace), true)
    .addField("WBS", formatBoolean(listing.wbsRequired), true)
    .addField("Netto-Kaltmiete", `${listing.costs.nettoCold} €`, true)
    .addField("Gesamtmiete", formatTotalCosts(listing.costs), true)
    .addField("Addresse", formatAddress(listing.address))
}

function formatAddress(address: Address): string {
  return `[${address.street} ${address.number}](https://maps.google.com/?q=${encodeURIComponent(address.street + " " + address.number + " " + address.zipCode)})`
}

// Heating costs might be null, thus total costs do not include them aswell
function formatTotalCosts(costs: Costs): string {
  if (costs.heating) {
    return `${costs.total} €`
  } else {
    return `${costs.total} € (zzgl. Heizkosten)`
  }
}

function formatBalconyAndTerrace(space: Space): string {
  if (space.balcony === true && space.terrace === true) {
    return "Balkon oder Terrasse"
  } else if (space.balcony) {
    return "Balkon"
  } else if (space.terrace) {
    return "Terrasse"
  } else {
    return "Nein"
  }
}

function formatBoolean(bool?: boolean | null): string {
  if (bool == null) {
    return "Keine Angabe"
  } else {
    return bool ? "Ja" : "Nein"
  }
}