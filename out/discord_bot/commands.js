"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const rest_1 = require("@discordjs/rest");
const v10_1 = require("discord-api-types/v10");
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;
const watch = new builders_1.SlashCommandBuilder()
    .setName('watch')
    .setDescription('Watch a websites and notify when it changes')
    .addStringOption(option => option.setName("url").setDescription('The webistes url').setRequired(true));
const unwatch = new builders_1.SlashCommandBuilder()
    .setName('unwatch')
    .setDescription('Watch a websites and notify when it changes')
    .addStringOption(option => option.setName("url").setDescription('The webistes url').setRequired(true));
const list = new builders_1.SlashCommandBuilder()
    .setName('list')
    .setDescription('List currently watched websites');
const commands = [
    watch,
    unwatch,
    list,
]
    .map(cmd => cmd.toJSON());
const rest = new rest_1.REST({ version: '10' }).setToken(token);
rest.put(v10_1.Routes.applicationGuildCommands(clientId, guildId), { body: commands });
console.log('Successfully reloaded application (/) commands.');
