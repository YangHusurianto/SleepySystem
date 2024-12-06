import { ExtendedInteraction } from '../typings/Command.ts';

export async function replyToInteraction(interaction: ExtendedInteraction, content: { content: string; ephemeral?: boolean } | string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(content);
  } else {
    await interaction.reply(content);
  }
}
