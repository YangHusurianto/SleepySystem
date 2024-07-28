import { MessageContextMenuCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';
import { logAction } from '../../utils/logs.ts';
import { ExtendedClient } from '../../structures/Client.ts';
import { botSelfCheck, roleHeirarchyCheck } from '../../utils/checks.ts';


import { ApplicationCommandType, escapeMarkdown, User } from 'discord.js';

export default new MessageContextMenuCommand({
  name: 'Delete Message',
  type: ApplicationCommandType.Message,
  run: async ({ interaction, client }: { interaction: ExtendedInteraction, client: ExtendedClient }) => {
    if (!interaction.isMessageContextMenuCommand()) return;

    const { guild, member } = interaction;
    const message = interaction.targetMessage;
    const target = message.author;

    if (await botSelfCheck(interaction, target, client, 'delete a message of')) return;
    if (await roleHeirarchyCheck(interaction, guild, target, member, 'delete a message of')) return;

    deleteMessage(interaction, message, guild, target, member);
  },
});

async function deleteMessage(
  interaction: ExtendedInteraction,
  message: any,
  guild: any,
  target: any,
  member: any
) {
  await message
    .delete()
    .then(async () => {
      await interaction.reply({
        content: `Message (${message.content}) deleted.`,
        ephemeral: true,
      });

      await logAction(
        guild,
        `**DEL MSG**\n` +
          `**Author:** ${escapeMarkdown(`${target.username} (${target.id}`, {
            inlineCode: true,
          })})\n` +
          `**Content:** ${message.content}\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { inlineCode: true }
          )})\n`
      );
    })
    .catch(async (err: any) => {
      console.error(err);
      return await interaction.reply({
        content: 'Failed to delete message.',
        ephemeral: true,
      });
    });
}
