import { Queue } from "bullmq"
import { Client, Intents, Message, MessageOptions, TextChannel } from "discord.js"
import { Listing } from "../listing"
import buildEmbed from "./listing_embed_builder"

export default class DiscordBot {

    private client: Client
    private debugChannel: TextChannel
    private subscriptions: Map<string, TextChannel>
    private queue: Queue<string>

    private constructor(client: Client, debugChannel: TextChannel, subscriptions: Map<string, TextChannel>, queue: Queue<string>) {
        this.client = client
        this.debugChannel = debugChannel
        this.subscriptions = subscriptions
        this.queue = queue

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return

            switch (interaction.commandName) {
                case 'subscribe':
                    if (interaction.channel?.type !== 'GUILD_TEXT') {
                        return interaction.reply("Dieser Channel ist kein Textchannel. Bitte versuche es erneut in einem Textchannel")
                    }

                    if (this.subscriptions.has(interaction.channelId)) {
                        return interaction.reply("Ich informiere bereits über neue Inserate in diesem Channel")
                    }

                    await this.subscribe(interaction.channel)

                    interaction.reply("Du wirst nun über neue Inserate in diesen Channel informiert 🎉")
                    break
                case 'unsubscribe':
                    if (!this.subscriptions.has(interaction.channelId)) {
                        return interaction.reply("Dieser Channel wird nicht über neue Inserate benachrichtigt")
                    }

                    await this.unsubscribe(interaction.channelId)
                    interaction.reply(`Du wirst nun nicht mehr über neue Inserate in diesem Channel informiert`)
                    break
                case 'filter':
                    const channel = interaction.channel
                    if (interaction.channel?.type !== 'GUILD_TEXT') {
                        return interaction.reply("Dieser Channel ist kein Textchannel. Bitte versuche es erneut in einem Textchannel")
                    }

                    if (this.subscriptions.has(interaction.channelId)) {
                        return interaction.reply("Ich informiere bereits über neue Inserate in diesem Channel")
                    }

                    const rooms = interaction.options.getNumber('Rooms')
                    const size = interaction.options.getNumber('Size')

                    interaction.reply("Filters are work in progress currently.")
                    break
                case 'list':
                    interaction.reply("Derzeit informieren wir über Inserate der folgenden Genossenschaften:\n"
                        + "- Baugenossenschaft dhu eG"
                        + "- Baugenossenschaft Dennerstraße-Selbsthilfe eG\n"
                        + "- Bauverein der Elbgemeinden eG"
                        + "- Hanseatische Baugenossenschaft Hamburg eG"
                        + "- SAGA Unternehemsngruppe\n"
                        + "- Walddörfer Wohnungsbaugenossenschaft eG\n"
                        + "- Wohnungsbaugenossenschaft KAIFU-NORDLAND eG"
                    )
                    break
                default:
                    interaction.reply("Unknown command provided")
                    break
            }
        })
    }

    static async init(subscriptions: string[], queueName: string): Promise<DiscordBot> {
        const token = process.env.TOKEN!
        const debugChannelId = process.env.DEBUG_CHANNEL!

        const bot = new Client({ intents: [Intents.FLAGS.GUILDS] })
        await bot.login(token)

        const debugChannel = await bot.channels.fetch(debugChannelId)
        if (debugChannel?.type !== "GUILD_TEXT") {
            throw "Debug channel not text based!"
        }

        const queue = new Queue(queueName, { connection: { host: process.env.REDIS_HOST!, port: 6379 }, sharedConnection: true })

        bot.on('error', (err) => {
            console.error(err)
            process.exit(1)
        })

        bot.once('ready', () => {
            console.log(`[Bot] Logged in as ${bot.user!.tag}! Debug channel-id: ${debugChannel.id}`)
            bot.user!.setActivity("for new listings", { type: "WATCHING" })
        })

        const channels = new Map<string, TextChannel>()
        for (const id of subscriptions) {
            const channel = await bot.channels.fetch(id)
            if (channel?.type === 'GUILD_TEXT') {
                channels.set(id, channel)
            } else {
                queue.add('remove', id)
            }
        }

        return new DiscordBot(bot, debugChannel, channels, queue)
    }

    async log(message: any): Promise<void> {
        await this.debugChannel.send(JSON.stringify(message))
    }

    async post(listings: Listing[]): Promise<void> {
        // TODO: Make filters configurable. Currently fitted for my specific situation.
        const filterdListings = listings.filter(listing => listing.space.roomCount > 2)

        const payload: MessageOptions = { embeds: filterdListings.map(buildEmbed) }
        var messages: Promise<Message<boolean>>[] = []
        for (const channel of this.subscriptions) {
            messages.push(channel[1].send(payload))
        }
        await Promise.allSettled(messages)
    }

    async subscribe(channel: TextChannel): Promise<void> {
        this.subscriptions.set(channel.id, channel)
        this.queue.add('add', channel.id)
    }

    async unsubscribe(id: string): Promise<void> {
        this.subscriptions.delete(id)
        this.queue.add('remove', id)
    }
}