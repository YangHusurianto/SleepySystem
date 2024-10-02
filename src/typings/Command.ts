import {
  ApplicationCommandType,
  AutocompleteInteraction,
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
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  run: RunFunction;
} & ChatInputApplicationCommandData;

export type MessageContextMenuCommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  dmPermission?: boolean;
  type: ApplicationCommandType.Message;
  run: RunFunction;
} & MessageApplicationCommandData;
