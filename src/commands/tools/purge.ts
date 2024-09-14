import { SlashCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';
import { logAction } from '../../utils/logs.ts';
import { ExtendedClient } from '../../structures/Client.ts';

import {
  ApplicationCommandOptionType,
  escapeMarkdown,
  GuildTextBasedChannel,
  User,
} from 'discord.js';

export default new SlashCommand({
  name: 'purge',
  description: 'Purge x amount of messages (optionally target a user)',
  dmPermission: false,
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'number',
      description: 'The number of messages to delete',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'The user to delete messages from',
      required: false,
    },
  ],
  run: async ({
    interaction,
  }: {
    client: ExtendedClient;
    interaction: ExtendedInteraction;
  }) => {
      const { options, guild } = interaction;
    const channel = interaction.channel as GuildTextBasedChannel;
    const number = options.getInteger('number') as number;
    const target = options.getUser('user') as User;

    if (!channel) return;

    purgeMessages(interaction, guild, channel, number, target);
  },
});

async function purgeMessages(
  interaction: ExtendedInteraction,
  guild: any,
  channel: GuildTextBasedChannel,
  number: number,
  target: User
) {
  var messages = await channel.messages.fetch({ limit: number });

  if (target) {
    messages = messages.filter((m: any) => m.author.id === target.id);
  }

  await channel
    .bulkDelete(messages, true)
    .then(async (messages: any) => {
      await interaction.reply({
        content: `Purged ${messages.size} messages.`,
        ephemeral: true,
      });

      await logAction(
        guild,
        `**PURGE**\n` +
          `**Amount:** ${messages.size}\n` +
          `**Channel:** ${channel}\n` +
          `**Moderator:** ${escapeMarkdown(
            `${interaction.member.user.username} (${interaction.member.user.id}`,
            { inlineCode: true }
          )})\n` +
          `PURGE LOG:\n${messages.map((m: any) => `"${m.author.username}": `+ m.content).join('\n')}`
      );
    })
    .catch(async (err: any) => {
      console.error(err);
      return await interaction.reply({
        content: 'Failed to purge messages.',
        ephemeral: true,
      });
    });
}
