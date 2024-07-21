import { Guild, TextChannel } from 'discord.js';
import { findGuild } from '../queries/guildQueries.ts';

export async function logMessage(guild: Guild, message: string) {
  const logChannel= await getChannel(guild, 'logChannel');
 
  if (!logChannel) return;
  logChannel.send(message);
}

export async function logAction(guild: Guild, message: string) {
  const actionChannel = await getChannel(guild, 'modActionsChannel');

  if (!actionChannel) return;
  actionChannel.send(message);
}

async function getChannel(guild: Guild, channel: string): Promise<TextChannel | null> {
  const guildDoc = await findGuild(guild);

  const channelId = guildDoc?.settings?.get(channel);
  if (channelId) {
    const channel = guild.channels.cache.get(channelId) as TextChannel;
    if (!channel) return null;

    return channel;
  }

  return null;
}

