import { Guild, GuildMember, InteractionResponse, Message, User } from 'discord.js';
import { ExtendedInteraction } from '../typings/Command.ts';
import { ExtendedClient } from '../structures/Client.ts';

export async function allChecks(
  interaction: ExtendedInteraction,
  client: ExtendedClient,
  guild: Guild,
  target: User,
  member: GuildMember,
  type: string,
): Promise<boolean> {
  if (await botSelfCheck(interaction, target, client, type)) return true;
  if (await roleHeirarchyCheck(interaction, guild, target, member, type))
    return true;

  return false;
}

export async function botSelfCheck(
  interaction: ExtendedInteraction,
  target: User,
  client: ExtendedClient,
  type: string
): Promise<boolean | Message<boolean> | InteractionResponse<boolean>> {
  if (target.id === client.user?.id) {
    const selfCheck = {
      content: `I cannot ${type} myself!`,
      ephemeral: true,
    };
    if (interaction.replied) return await interaction.editReply(selfCheck);
    else return await interaction.reply(selfCheck);
  }

  if (target.id === interaction.member.id) {
    const selfCheck = {
      content: `You cannot ${type} yourself!`,
      ephemeral: true,
    };
    if (interaction.replied) return await interaction.editReply(selfCheck);
    else return await interaction.reply(selfCheck);
  }

  return false;
}

// Return false if the check has passed or needs to be bypassed
export async function roleHeirarchyCheck(
  interaction: ExtendedInteraction,
  guild: Guild,
  target: User,
  member: GuildMember,
  type: string
) {
  return await guild.members
    .fetch(target.id)
    .then(async (targetMember) => {
      if (
        member.roles.highest.comparePositionTo(targetMember.roles.highest) < 1
      ) {
        const banCheck = {
          content: `You cannot ${type} a member with a higher or equal role than you!`,
          ephemeral: true,
        };
        if (interaction.replied) return await interaction.editReply(banCheck);
        else return await interaction.reply(banCheck);
      }

      return false;
    })
    .catch(async (err) => {
      let permCheck: any;

      if (type === 'ban') {
        permCheck = {
          content:
            'Failed to fetch member for permissions check. Attempting to ban user anyway...',
          ephemeral: true,
        };
      }

      permCheck = {
        content: 'Failed to fetch member for permissions check. Proceeding anyway...',
        ephemeral: true,
      };

      if (interaction.replied) await interaction.editReply(permCheck);
      else await interaction.reply(permCheck);

      return false;
    });
}
