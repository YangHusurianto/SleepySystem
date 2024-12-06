import { Guild, GuildMember, InteractionResponse, Message, User } from 'discord.js';
import { ExtendedInteraction } from '../typings/Command.ts';
import { ExtendedClient } from '../structures/Client.ts';
import { replyToInteraction } from './utils.ts';

export async function allChecks(
  interaction: ExtendedInteraction,
  client: ExtendedClient,
  guild: Guild,
  target: User,
  member: GuildMember,
  type: string,
): Promise<boolean> {
  let content = '';

  const botSelfCheckContent = botSelfCheck(interaction, target, client, type);
  if (botSelfCheckContent) {
    let reply = {
      content: botSelfCheckContent,
      ephemeral: true,
    };

    await replyToInteraction(interaction, reply);

    return true;
  }

  const roleHeirarchyCheckContent = await roleHeirarchyCheck(guild, target, member, type);
  if (roleHeirarchyCheckContent) {
    let reply = {
      content: roleHeirarchyCheckContent,
      ephemeral: true,
    };

    await replyToInteraction(interaction, reply);

    if (roleHeirarchyCheckContent.includes('fetch')) {
      return false;
    }

    return true;
  }

  return false;
}

export function botSelfCheck(
  interaction: ExtendedInteraction,
  target: User,
  client: ExtendedClient,
  type: string
): string {
  if (target.id === client.user?.id) {
    return `I cannot ${type} myself!`;
  }

  if (target.id === interaction.member.id) {
    return `You cannot ${type} yourself!`;
  }

  return '';
}

// Return false if the check has passed or needs to be bypassed
export async function roleHeirarchyCheck(
  guild: Guild,
  target: User,
  member: GuildMember,
  type: string
): Promise<string> {
  let content = '';

  await guild.members
    .fetch(target.id)
    .then(async (targetMember) => {
      if (
        member.roles.highest.comparePositionTo(targetMember.roles.highest) < 1
      ) {
          content = `You cannot ${type} a member with a higher or equal role than you!`;
      }
    })
    .catch(async (err) => {
      content = 'Failed to fetch member for permissions check. Proceeding anyway...';

      if (type === 'ban') {
        content ='Failed to fetch member for permissions check. Attempting to ban user anyway...';
      }
    });

  return content;
}
