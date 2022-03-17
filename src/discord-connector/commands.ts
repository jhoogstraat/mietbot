import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

const clientId = process.env.CLIENT_ID!
const guildId = process.env.GUILD_ID!
const token = process.env.TOKEN!

const subscribe = new SlashCommandBuilder()
  .setName('subscribe')
  .setDescription('Get notifications when new listings are found in this channel')

const unsubscribe = new SlashCommandBuilder()
  .setName('unsubscribe')
  .setDescription('Stop receiving updates from this bot')

const list = new SlashCommandBuilder()
  .setName('list')
  .setDescription('List providers')


const commands = [
  subscribe,
  unsubscribe,
  list
]
  .map(cmd => cmd.toJSON())

const rest = new REST({ version: '10' }).setToken(token);

rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  { body: commands },
);

console.log('Successfully reloaded application (/) commands.');


