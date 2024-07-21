import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  PermissionResolvable,
} from 'discord.js';
import { ExtendedClient } from '../structures/Client.ts';

export interface ExtendedInteraction extends CommandInteraction {
  options: CommandInteractionOptionResolver;
  guild: Guild;
  member: GuildMember;
}

interface RunOptions {
  args: CommandInteractionOptionResolver;
  client: ExtendedClient;
  interaction: ExtendedInteraction;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  dmPermission?: boolean;
  run: RunFunction;
} & ChatInputApplicationCommandData;
