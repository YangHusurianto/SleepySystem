import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
} from 'discord.js';
import { CommandType } from '../typings/Command.ts';
import { glob } from 'glob';
import { RegisterCommandsOptions } from '../typings/Client.ts';
import { Event } from './Event.ts';
import { connect } from 'mongoose';
const __dirname = import.meta.dirname;

export class ExtendedClient extends Client {
  commands: Collection<string, CommandType> = new Collection();

  constructor() {
    super({ intents: ['Guilds', 'GuildMembers', 'GuildModeration'] });
  }

  async start() {
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
    let slashCommands: ApplicationCommandDataResolvable[] = [];
    const commandFiles: any = await glob(
      `${__dirname}/../commands/**/*{.ts,.js}`,
      { windowsPathsNoEscape: true }
    );
    const commandFilePrefix = process.env.ENV === 'dev' ? 'file://' : '';

    commandFiles.forEach(async (filePath: string) => {
      const command: CommandType = await this.importFile(
        commandFilePrefix + filePath
      );

      this.commands.set(command.name, command);
      slashCommands.push(command);
    });

    this.on('ready', () => {
      switch (process.env.ENV) {
        case 'dev':
          this.registerCommands({
            commands: slashCommands,
            guildId: process.env.GUILD_ID,
          });
          break;
        case 'prod':
          this.registerCommands({
            commands: slashCommands,
          });
          break;
        default:
          console.error('Invalid environment');
      }
    });

    const eventFiles: any = await glob(`${__dirname}/../events/**/*{.ts,.js}`, {
      windowsPathsNoEscape: true,
    });

    eventFiles.forEach(async (filePath: string) => {
      const event: Event<keyof ClientEvents> = await this.importFile(
        commandFilePrefix + filePath
      );

      this.on(event.event, event.run);
    });
  }

  async connectDatabase() {
    const mongoConnection = process.env.MONGO_CONNECTION;
    if (!mongoConnection) {
      throw new Error('MongoDB connection string is not defined.');
    }
    connect(mongoConnection).catch(console.error);
  }
}
