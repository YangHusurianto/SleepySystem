import { ExtendedClient } from '../../structures/Client.ts';

import { glob } from 'glob';
import { ApplicationCommandDataResolvable, ClientEvents } from 'discord.js';
import { CommandType } from '../../typings/Command.ts';

export default async function handleCommands(
  client: ExtendedClient,
  __dirname: string,
  filePrefix: string
) {
  let commands: ApplicationCommandDataResolvable[] = [];
  const commandFiles: any = await glob(
    `${__dirname}/../commands/**/*{.ts,.js}`,
    { windowsPathsNoEscape: true }
  );

  commandFiles.forEach(async (filePath: string) => {
    if (filePath.includes('temp')) return;

    const command: CommandType = await client.importFile(filePrefix + filePath);

    client.commands.set(command.name, command);
    commands.push(command);
  });

  client.on('ready', async () => {
    switch (process.env.ENV) {
      case 'dev':
        client.registerCommands({
          commands: commands,
          guildId: process.env.GUILD_ID,
        });
        break;
      case 'prod':
        client.registerCommands({
          commands: commands,
        });
        break;
      default:
        console.error('Invalid environment');
    }
  });
}