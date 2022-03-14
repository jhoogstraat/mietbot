"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
async function main() {
    const token = process.env.TOKEN;
    const bot = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS] });
    await bot.login(token);
    bot.once('ready', () => {
        console.log(`Logged in as ${bot.user.tag}!`);
    });
    bot.on('error', (err) => {
        console.error(err);
        process.exit(1);
    });
    bot.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand())
            return;
        if (interaction.commandName === 'watch') {
            interaction.reply(`Watching for changes`);
        }
        else if (interaction.commandName === 'unwatch') {
            interaction.reply(`Not watching anymore`);
        }
        else if (interaction.commandName === 'list') {
        }
    });
}
main();
