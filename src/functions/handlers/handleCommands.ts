import { ExtendedClient } from '../../structures/Client.ts';

import { glob } from 'glob';
import mongoose from 'mongoose';
import { ApplicationCommandDataResolvable, ClientEvents } from 'discord.js';
import fs from 'fs';
import { CommandType } from '../../typings/Command.ts';

export default async function handleCommands(
  client: ExtendedClient,
  __dirname: string,
  filePrefix: string
) {
  let slashCommands: ApplicationCommandDataResolvable[] = [];
  const commandFiles: any = await glob(
    `${__dirname}/../commands/**/*{.ts,.js}`,
    { windowsPathsNoEscape: true }
  );

  commandFiles.forEach(async (filePath: string) => {
    if (filePath.includes('temp')) return;

    const command: CommandType = await client.importFile(filePrefix + filePath);

    client.commands.set(command.name, command);
    slashCommands.push(command);
  });

  client.on('ready', async () => {
    switch (process.env.ENV) {
      case 'dev':
        client.registerCommands({
          commands: slashCommands,
          guildId: process.env.GUILD_ID,
        });
        break;
      case 'prod':
        client.registerCommands({
          commands: slashCommands,
        });
        break;
      default:
        console.error('Invalid environment');
    }
  });
}