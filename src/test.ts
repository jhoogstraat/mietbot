import 'dotenv/config'
import { Client, Intents, MessageEmbed } from "discord.js"
import puppeteer from "puppeteer"
import { Listing } from "./listing"
import buildApartmentEmbed from "./discord-connector/listing_embed_builder"
import KAIFUProvider from "./scraper/providers/kaifu_provider"
import WalddoerferProvider from "./scraper/providers/walddoerfer_provider"
import { Provider } from "./scraper/provider"
import BDSProvider from "./scraper/providers/bds_provider"
import SAGAProvider from "./scraper/providers/saga_provider"


async function testSendingDiscord() {
    const bot = new Client({ intents: [Intents.FLAGS.GUILDS] })
    await bot.login(process.env.TOKEN!)
    const debugChannel = await bot.channels.fetch(process.env.DEBUG_CHANNEL!)!

    if (debugChannel?.isText()) {
        const listings = await testProvider(new SAGAProvider(new Set()))
        const embeds = listings.map(buildApartmentEmbed)
        const message = await debugChannel.send({ embeds: embeds })
    }
}

async function testProvider(provider: Provider): Promise<Listing[]> {
    const browser = await puppeteer.launch({ headless: false })
    const listings = await provider.run(browser)
    await browser.close()
    return listings
}

const providers = [new BDSProvider(new Set()), new SAGAProvider(new Set()), new WalddoerferProvider(new Set()), new KAIFUProvider(new Set())]

for (const provider of providers) {
    const listings = await testProvider(provider)
    console.log(listings)

}