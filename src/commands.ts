import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

const clientId = process.env.CLIENT_ID!
const guildId = process.env.GUILD_ID!
const token = process.env.TOKEN!

const watch = new SlashCommandBuilder()
  .setName('watch')
  .setDescription('Watch a websites and notify when it changes')
  .addStringOption(option => option.setName("url").setDescription('The webistes url').setRequired(true))

const unwatch = new SlashCommandBuilder()
  .setName('unwatch')
  .setDescription('Watch a websites and notify when it changes')
  .addStringOption(option => option.setName("url").setDescription('The webistes url').setRequired(true))

const list = new SlashCommandBuilder()
  .setName('list')
  .setDescription('List currently watched websites')


const commands = [
  watch,
  unwatch,
  list,
]
  .map(cmd => cmd.toJSON())

const rest = new REST({ version: '10' }).setToken(token);

rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  { body: commands },
);

console.log('Successfully reloaded application (/) commands.');


