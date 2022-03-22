import { MessageEmbed } from "discord.js";
import { Appartment, Costs } from "../appartment_type";

export default buildEmbed

function buildEmbed(appartment: Appartment): MessageEmbed {
  const embed = new MessageEmbed()
    .setTitle(`${appartment.space.roomCount} Zimmer in ${appartment.address.district ?? appartment.address.zipCode}`)
    .setURL(appartment.detailURL)
    .addField("Wohnfläche", `ca. ${appartment.space.area} m²`, true)
    .addField("Etage", appartment.space.floor?.toString() ?? "Keine Angabe", true)
    .addField("Balkon / Terrasse", formatBoolean(appartment.space.balcony), true)
    // .addField("Terrasse", formatBoolean(appartment.space.terrace), true)
    .addField("WBS", formatBoolean(appartment.wbsRequired), true)
    .addField("Netto-Kaltmiete", `${appartment.costs.nettoCold} €`, true)
    .addField("Gesamtmiete", formatTotalCosts(appartment.costs), true)
    .addField("Addresse", `[${appartment.address.street} ${appartment.address.number}](https://maps.google.com/?q=${encodeURIComponent(appartment.address.street + " " + appartment.address.number + " " + appartment.address.zipCode)})`)

  if (appartment.previewImageURL) {
    embed.setImage(appartment.previewImageURL)
  }

  if (appartment.availableFrom) {
    embed.addField("Verfügbar ab", appartment.availableFrom)
  }

  embed.addField("Anbieter", appartment.provider)

  return embed
}

// Heating costs might be null, thus total costs do not include them aswell
function formatTotalCosts(costs: Costs): string {
  if (costs.heating) {
    return `${costs.total} €`
  } else {
    return `${costs.total} € (zzgl. Heizkosten)`
  }
}

function formatBoolean(bool?: boolean | null): string {
  if (bool === undefined || bool === null) {
    return "Keine Angabe"
  } else {
    return bool ? "Ja" : "Nein"
  }
}