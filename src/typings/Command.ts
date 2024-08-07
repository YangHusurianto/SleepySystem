import {
  ApplicationCommandType,
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  Message,
  MessageApplicationCommandData,
  MessageContextMenuCommandInteraction,
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

type RunFunction = (options: RunOptions) => Promise<void>;

export type CommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  dmPermission?: boolean;
  run: RunFunction;
} & ChatInputApplicationCommandData;

export type MessageContextMenuCommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  dmPermission?: boolean;
  type: ApplicationCommandType.Message;
  run: RunFunction;
} & MessageApplicationCommandData;

// export type MessageContextMenuCommandType = CommandType & {
//   type: ApplicationCommandType.Message;
// };