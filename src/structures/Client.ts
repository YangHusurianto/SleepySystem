import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
} from 'discord.js';
import { CommandType } from '../typings/Command';
import { glob } from 'glob';
import { promisify } from 'util';
import { RegisterCommandsOptions } from '../typings/Client';
import { Event } from './Event';

export class ExtendedClient extends Client {
  commands: Collection<string, CommandType> = new Collection();

  constructor() {
    super({ intents: ['Guilds', 'GuildMembers', 'GuildModeration'] });
  }

  async start() {
    console.log('Bot started');
    this.login(process.env.TOKEN);
    console.log('Bot logged in');
    this.registerModules();
    console.log('Modules registered');
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
    console.log('Registering modules...');
    let slashCommands: ApplicationCommandDataResolvable[] = [];
    console.log('Registering commands...');
    const commandFiles: any = await glob(
      `${__dirname}/../commands/**/*{.ts,.js}`,
      { windowsPathsNoEscape: true }
    );
    const commandFilePrefix = process.env.ENV === 'dev' ? 'file://' : '';

    console.log('test');
    console.log(commandFiles);

    commandFiles.forEach(async (filePath: string) => {
      const command: CommandType = await this.importFile(commandFilePrefix + filePath);

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

    const eventFiles: any = await glob(`${__dirname}/../events/*{.ts,.js}`, {
      windowsPathsNoEscape: true,
    });
    console.log(eventFiles);

    eventFiles.forEach(async (filePath: string) => {
      console.log(filePath);
      const event: Event<keyof ClientEvents> = await this.importFile(
        commandFilePrefix + filePath
      );

      this.on(event.event, event.run);
    });
  }
}
