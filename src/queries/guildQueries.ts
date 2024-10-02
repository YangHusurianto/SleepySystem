import { Guild } from 'discord.js';
import GuildSchema, { IGuild } from '../schemas/guild.ts';

import mongoose from 'mongoose';

export async function findGuild(guild: Guild): Promise<IGuild | null> {
  return await GuildSchema.findOneAndUpdate(
    { guildId: guild.id },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.iconURL(),
        caseNumber: 0,
        loggingChannel: '',
        users: [],
        autoTags: new Map(),
        channelTags: new Map(),
        settings: new Map(),
        settingsMap: new Map(),
      },
    },
    { upsert: true, new: true }
  );
}

export async function getAutoTags(guild: Guild) {
  const guildDoc = await findGuild(guild);
  return guildDoc?.tags;
}

export async function getChannelTags(guild: Guild) {
  const guildDoc = await findGuild(guild);
  return guildDoc?.channelTags;
}

export async function getReplacedReason(guild: Guild, reason: string): Promise<string> {
  const guildDoc = await findGuild(guild);
  let finalReason: string = guildDoc?.tags?.get(reason) || '';

  if (!finalReason) {
    const channelTags = guildDoc?.channelTags;
    if (!channelTags?.size) return reason;

    const tagPattern = new RegExp(
      Object.keys(Object.fromEntries(channelTags)).join('|'),
      'g'
    );

    finalReason = reason.replace(
      tagPattern,
      (matched) => `<#${channelTags.get(matched)}>`
    );
  }

  return finalReason;
}
