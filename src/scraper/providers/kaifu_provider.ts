import { Provider } from "../provider"
import { Category, Listing } from "../../listing"
import fetch from 'node-fetch'
import puppeteer from 'puppeteer'
import * as Formatter from '../formatter'

export default class KAIFUProvider extends Provider {
    constructor(listings: Set<string>) {
        super('kaifu', 'https://kaifu.de/api/property-supply/all', listings)
    }

    async run(browser: puppeteer.Browser): Promise<Listing[]> {
        const listings = await fetch(this.url).then(response => response.json() as any)

        const apartments: Listing[] = []
        for (let listing of listings) {

            apartments.push({
                provider: this.name,
                id: listing.obj_details.obj_numb,
                category: this.formatCategory(listing.category[0].value),
                space: {
                    roomCount: listing.obj_details.rooms,
                    area: Formatter.formatNumber(listing.obj_details.size),
                    floor: null,
                    balcony: null,
                    terrace: null,
                },
                address: {
                    street: listing.address.street,
                    number: listing.address.street_num ?? null,
                    zipCode: listing.address.postcode,
                    state: listing.address.town,
                    district: null,
                },
                costs: {
                    nettoCold: Formatter.formatNumber(listing.expenses.netto),
                    operating: Formatter.formatNumber(listing.expenses.operating_costs),
                    heating: Formatter.formatNumber(listing.expenses.heating_costs),
                    total: Formatter.formatNumber(listing.expenses.total)
                },
                wbsRequired: listing.obj_details.wbs === 'Ja',
                availableFrom: listing.obj_details.verfuegbar_ab,
                detailURL: 'https://kaifu.de' + listing.url,
                previewImageURL: listing.teaserImgUrl,
                timestamp: new Date()
            })
        }

        return apartments
    }

    // TODO: Scan for additional categories
    formatCategory(category: string): Category {
        if (category === 'stellplatz') {
            return 'parking'
        } else {
            return 'apartment'
        }
    }
}
