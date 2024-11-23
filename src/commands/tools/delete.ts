import { MessageContextMenuCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';
import { logAction } from '../../utils/logs.ts';
import { ExtendedClient } from '../../structures/Client.ts';
import { allChecks } from '../../utils/checks.ts';


import { ApplicationCommandType, escapeMarkdown, User } from 'discord.js';

export default new MessageContextMenuCommand({
  name: 'Delete Message',
  type: ApplicationCommandType.Message,
  run: async ({ interaction, client }: { interaction: ExtendedInteraction, client: ExtendedClient }) => {
    if (!interaction.isMessageContextMenuCommand()) return;

    const { guild, member } = interaction;
    const message = interaction.targetMessage;
    const target = message.author;

    if (await allChecks(interaction, client, guild, target, member, 'delete a message of' )) return;

    deleteMessage(interaction, message, guild, target, member);
  },
});

async function deleteMessage(
  interaction: ExtendedInteraction,
  message: any,
  guild: any,
  target: User,
  member: any
) {
  await message
    .delete()
    .then(async () => {
      const confirmationReply = {
        content: `Message (${message.content}) deleted.`,
        ephemeral: true,
      }

      if (interaction.replied) await interaction.editReply(confirmationReply);
      else await interaction.reply(confirmationReply);

      await logAction(
        guild,
        false,
        `**DEL MSG**\n` +
          `**Author:** ${target} | ${escapeMarkdown(`${target.username} (${target.id}`, {
            inlineCode: true,
          })})\n` +
          `**Content:** ||${message.content}||\n` +
          `**Channel:** ${message.channel}\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { inlineCode: true }
          )})\n`  
      );
    })
    .catch(async (err: any) => {
      console.error(err);
      const errorReply = {
        content: 'Failed to delete message.',
        ephemeral: true,
      };

      if (interaction.replied) await interaction.editReply(errorReply);
      else await interaction.reply(errorReply);
    });
}
