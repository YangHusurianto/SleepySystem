import { findGuild } from '../../queries/guildQueries.ts';
import { findAndCreateUser } from '../../queries/userQueries.ts';
import { SlashCommand } from '../../structures/Command.ts';
import { logAction } from '../../utils/logs.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';

import { ApplicationCommandOptionType, User, escapeMarkdown } from 'discord.js';

export default new SlashCommand({
  name: 'note',
  description: 'Create a note for a user',
  dmPermission: false,
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'The user to note',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'note',
      description: 'The note',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'private',
      description: 'Whether the note should be logged privately',
      required: false,
    }
  ],
  run: async ({ interaction }: { interaction: ExtendedInteraction }) => {
    const { options, guild, member } = interaction;
    const target = options.getUser('user') as User;
    var noteInfo = options.getString('note') as string;
    const isPrivate = options.getBoolean('private') || false;
    const date = new Date();

    try {
      const guildDoc = await findGuild(guild);
      if (!guildDoc)
        return console.error(`Failed to find guild for ${guild.id}.`);

      const note = {
        guildId: guild.id,
        targetUserId: target.id,
        noteNumber: guildDoc.caseNumber,
        note: noteInfo,
        noteDate: date,
        moderatorUserId: member.user.id,
      };

      let userDoc = await findAndCreateUser(guild.id, target.id);
      userDoc?.notes.push(note);

      guildDoc.incrementCaseNumber();
      await guildDoc.save().catch(async (err) => {
        await interaction.reply(`:x: Failed to update case number.`);
        console.error(err);
      });

      await userDoc.save().catch(async (err) => {
        await interaction.reply(`:x: Failed to save note.`);
        console.error(err);
      });

      await interaction.reply({
        content: `<:check:1196693134067896370> A note has been placed under ${target}.`,
        ephemeral: true,
      });

      return await logAction(
        guild,
        isPrivate,
        `**NOTE** | Case #${guildDoc.caseNumber}\n` +
          `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
            inlineCode: true,
          })})\n` +
          `**Moderator:** ${escapeMarkdown(
            `${member.user.username} (${member.user.id}`,
            { inlineCode: true }
          )})\n` +
          `**Note:** ${noteInfo}\n`
      );
    } catch (err) {
      console.error(err);
    }
  },
});
