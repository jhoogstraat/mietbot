import { Client, Intents, MessageOptions, MessagePayload, TextBasedChannel, TextChannel } from "discord.js"
import { Appartment } from "../appartment_type"
import buildEmbed from "./appartment_embed_builder"

export default class DiscordBot {

    private client: Client
    private debugChannel: TextChannel
    private subscriptions: TextChannel[]

    private constructor(client: Client, debugChannel: TextChannel, subscriptions: TextChannel[]) {
        this.client = client
        this.debugChannel = debugChannel
        this.subscriptions = subscriptions
    }

    static async init(subscriptions: string[]): Promise<DiscordBot> {
        const token = process.env.TOKEN!
        const debugChannelId = process.env.DEBUG_CHANNEL!

        const bot = new Client({ intents: [Intents.FLAGS.GUILDS] })
        await bot.login(token)

        const debugChannel = await bot.channels.fetch(debugChannelId)

        if (debugChannel?.type !== "GUILD_TEXT") {
            throw "Debug channel not text based!"
        }

        bot.on('error', (err) => {
            console.error(err)
            process.exit(1)
        })

        bot.once('ready', () => {
            console.log(`[Bot] Logged in as ${bot.user!.tag}! Debug channel-id: ${debugChannel.id}`)
            bot.user!.setActivity("for new listings", { type: "WATCHING" })
        })

        bot.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return

            if (interaction.commandName === 'subscribe') {
                interaction.reply(`Watching for changes`)
            } else if (interaction.commandName === 'unsubscribe') {
                interaction.reply(`Not watching anymore`)
            }
        })

        const allChannels = await Promise.all(subscriptions.map((id => bot.channels.fetch(id))))
        const textChannels = allChannels.flatMap(channel => channel?.type == "GUILD_TEXT" ? [channel] : [])

        return new DiscordBot(bot, debugChannel, textChannels)
    }

    async log(message: string): Promise<void> {
        await this.debugChannel.send(message)
    }

    async post(appartments: Appartment[]): Promise<void> {
        const payload: MessageOptions = { embeds: appartments.map(buildEmbed) }
        await this.debugChannel.send(payload)
        // await Promise.all(this.subscriptions.map(channel => channel.send(payload)))
    }
}