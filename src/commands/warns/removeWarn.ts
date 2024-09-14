import { SlashCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';

import { ApplicationCommandOptionType, escapeMarkdown, User } from 'discord.js';
import { ExtendedClient } from '../../structures/Client.ts';
import { logAction } from '../../utils/logs.ts';
import { allChecks } from '../../utils/checks.ts';
import {
  findInfraction,
  removeInfraction,
} from '../../queries/infractionQueries.ts';

export default new SlashCommand({
  name: 'removewarn',
  description: 'Remove a warning from a user',
  dmPermission: false,
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: 'warn_number',
      description: 'The case number to remove',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'private',
      description: 'Whether the note should be logged privately',
      required: false,
    },
  ],
  run: async ({
    client,
    interaction,
  }: {
    client: ExtendedClient;
    interaction: ExtendedInteraction;
  }) => {
    const { options, guild, member } = interaction;
    const target = options.getUser('user') as User;
    const warnNumber = options.getInteger('warn_number') as number;
    const isPrivate = options.getBoolean('private') || false;

    await removeWarn(interaction, client, guild, member, warnNumber, isPrivate);
  },
});

async function removeWarn(
  interaction: ExtendedInteraction,
  client: ExtendedClient,
  guild: any,
  member: any,
  warnNumber: number,
  isPrivate: boolean
) {
  const userDoc = await findInfraction(guild.id, warnNumber);
  if (!userDoc) {
    return await interaction.reply(
      `:x: Failed to find warning number ${warnNumber}.`
    );
  }

  const infraction = userDoc.infractions.find(
    (infraction) => infraction.number === warnNumber
  );

  if (!infraction || infraction.type !== 'WARN') {
    return await interaction.reply(
      `:x: Case number ${warnNumber} is not a warning.`
    );
  }

  return await removeInfraction(infraction.targetUserId, guild.id, warnNumber)
    .then(async () => {
      await interaction.reply(
        `<:check:1196693134067896370> Removed warning #${warnNumber}.`
      );

      const target = await client.users.fetch(infraction.targetUserId);

      return await logAction(
        guild,
        isPrivate,
        `**REMOVE WARN** | Case #${warnNumber}\n` +
          `**Target:** ${escapeMarkdown(
            `${target.username} (${target.id}`,
            {
              inlineCode: true,
            }
          )})\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { inlineCode: true }
          )})\n` +
          `**Warn:** ${infraction.reason}\n`
      );
    })
    .catch(async (err) => {
      await interaction.reply(`:x: Failed to remove warning.`);
      console.error(err);
    });
}
