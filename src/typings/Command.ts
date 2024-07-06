import { ChatInputApplicationCommandData, CommandInteraction, CommandInteractionOptionResolver, CommandInteractionResolvedData, GuildMember, PermissionResolvable } from "discord.js";
import { ExtendedClient } from '../structures/Client';

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

interface RunOptions {
  args: CommandInteractionOptionResolver;
  client: ExtendedClient;
  interaction: CommandInteraction;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown?: number;
  run: RunFunction;
} & ChatInputApplicationCommandData