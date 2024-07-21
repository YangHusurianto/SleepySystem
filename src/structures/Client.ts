import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
} from 'discord.js';
import { CommandType } from '../typings/Command.ts';
import { glob } from 'glob';
import { RegisterCommandsOptions } from '../typings/Client.ts';
import { connect } from 'mongoose';
import handleEvents from '../functions/handlers/handleEvents.ts';
import handleCommands from '../functions/handlers/handleCommands.ts';
const __dirname = import.meta.dirname;

export class ExtendedClient extends Client {
  commands: Collection<string, CommandType> = new Collection();

  constructor() {
    super({ intents: ['Guilds', 'GuildMembers', 'GuildModeration'] });
  }

  async start() {
    console.log('Starting bot');
    this.login(process.env.TOKEN);
    this.registerModules();
    this.connectDatabase();
  }

  async importFile(filePath: string) {
    return (await import(filePath))?.default;
  }

  async registerCommands({ commands, guildId }: RegisterCommandsOptions) {
    if (guildId) {
      this.guilds.cache.get(guildId)?.commands.set(commands);
      console.log(`Registered ${commands.length} commands to guild ${guildId}`);

      return;
    }

    this.application?.commands.set(commands);
    console.log(`Registered ${commands.length} commands globally`);
  }

  async registerModules() {
    // const filePrefix = process.env.ENV === 'dev' ? 'file://' : '';
    const filePrefix = 'file://';

    handleCommands(this, __dirname, filePrefix);

    console.log('Handling events now');

    handleEvents(this, __dirname, filePrefix);
  }

  async connectDatabase() {
    const mongoConnection = process.env.MONGO_URI;
    if (!mongoConnection) {
      throw new Error('MongoDB connection string is not defined.');
    }

    return connect(mongoConnection).catch(console.error);
  }
}
