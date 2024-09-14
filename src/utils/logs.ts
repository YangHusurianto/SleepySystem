import { Guild, TextChannel } from 'discord.js';
import { findGuild } from '../queries/guildQueries.ts';
import { IGuild } from '../schemas/guild.ts';

export async function logMessage(guild: Guild, message: string) {
  const logChannel = await getChannel(guild, 'logChannel');

  if (!logChannel) return;
  logChannel.send(message);
}

export async function logAction(
  guild: Guild,
  isPrivate: boolean,
  message: string
) {
  var modActionsChannel = 'modActionsChannel';

  if (isPrivate) {
    modActionsChannel = 'hiddenModActionsThread';
  }

  const actionChannel = await getChannel(guild, modActionsChannel);

  if (!actionChannel) return;
  actionChannel.send(message);
}

async function getChannel(
  guild: Guild,
  channel: string
): Promise<TextChannel | null> {
  const guildDoc = await findGuild(guild);

  if (!guildDoc) return null;

  const channelId = guildDoc.settings.get(channel);
  if (channelId) {
    const channel = guild.channels.cache.get(channelId) as TextChannel;
    if (!channel) return null;

    return channel;
  }

  return null;
}
