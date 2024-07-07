import { Event } from '../../structures/Event.ts';
import { ExtendedClient } from '../../structures/Client.ts';

import { glob } from 'glob';
import mongoose from 'mongoose';
import { ClientEvents } from 'discord.js';
import fs from 'fs';

export default async function handleEvent(
  client: ExtendedClient,
  __dirname: string,
  filePrefix: string
) {
  const eventFolders = fs.readdirSync(`${__dirname}/../events`);

  eventFolders.forEach(async (folder) => {
    const events = await glob(`${__dirname}/../events/${folder}/*{.ts,.js}`, {
      windowsPathsNoEscape: true,
    });

    switch (folder) {
      case 'client':
        events.forEach(async (filePath) => {
          const event: Event<keyof ClientEvents> = await client.importFile(
            filePrefix + filePath
          );

          client.on(event.event, event.run);
        });
        break;

      case 'mongo':
        events.forEach(async (filePath) => {
          const event = await client.importFile(filePrefix + filePath);

          if (event.once) {
            mongoose.connection.once(event.name, event.execute);
          } else {
            mongoose.connection.on(event.name, event.execute);
          }
        });
        break;
    }
  });
}
