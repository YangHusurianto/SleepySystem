import { SlashCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';
import { findGuild, getReplacedReason } from '../../queries/guildQueries.ts';

import {
  ApplicationCommandOptionType,
  escapeMarkdown,
  User,
} from 'discord.js';
import mongoose from 'mongoose';
import { findAndCreateUser } from '../../queries/userQueries.ts';
import { ExtendedClient } from '../../structures/Client.ts';
import { logAction } from '../../utils/logs.ts';
import { allChecks } from '../../utils/checks.ts';
import { IGuild } from '../../schemas/guild.ts';

export default new SlashCommand({
  name: 'warn',
  description: 'Warn a user by sending them a private message',
  dmPermission: false,
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'The user to warn',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'reason',
      description: 'The reason',
      required: true,
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
    var reason = options.getString('reason') as string;

    // self and permission checks
    if (await allChecks(interaction, guild, target, member, client, 'warn')) return;

    // get user document
    const guildDoc = await findGuild(guild);
    if (!guildDoc) return console.error(`Failed to find guild for ${guild.id}.`);

    // get full reason and warn
    reason = await getReplacedReason(guild, reason);    
    await warnUser(interaction, client, guild, member, target, guildDoc, reason);

    //log to channel
    return await logAction(
      guild,
      `**WARN** | Case #${Number(guildDoc.caseNumber) - 1}\n` +
        `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
          inlineCode: true,
        })})\n` +
        `**Moderator:** ${escapeMarkdown(
          `${member.user.username} (${member.user.id}`,
          { inlineCode: true }
        )})\n` +
        `**Reason:** ${reason}\n`
    );
  },
});

async function warnUser(
  interaction: ExtendedInteraction,
  client: ExtendedClient,
  guild: any,
  member: any,
  target: any,
  guildDoc: IGuild,
  reason: string
) {
  // create the warning first so we can insert regardless of whether the user exists
  const warning = {
    guildId: guild.id,
    targetUserId: target.id,
    type: 'WARN',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    duration: 'null',
    moderatorUserId: member.user.id,
    moderatorNotes: '',
  };

  let userDoc = await findAndCreateUser(guild.id, target.id);
  userDoc.infractions.push(warning);

  guildDoc.incrementCaseNumber();

  await guildDoc.save().catch(async (err) => {
    await interaction.reply(`:x: Failed to update case number.`);
    console.error(err);
  });

  await userDoc.save().catch(async (err) => {
    await interaction.reply(`:x: Failed to save warning.`);
    console.error(err);
  });

  await interaction.reply(
    `<:check:1196693134067896370> ${target} has been warned.`
  );

  client.users
    .send(
      target.id,
      `You have received a warning in ${guild.name}.\n` +
        'This warning is to inform you that we believe a rule ' +
        'has been broken. Warnings are gentle friendly reminders ' +
        'of the rules on our server! You have nothing to worry about ' +
        'unless you keep repeating what we warned you for.\n' +
        `If you believe this warn was made in error, please make a ticket here: <#${guildDoc.settings?.get(
          'ticketChannel'
        )}>.\n\n` +
        `Warning: ${reason}`
    )
    .catch((_err) => {
      console.log('Failed to dm user about warn.');
    });
}






//   async autocomplete(interaction) {
//     const focusedValue = interaction.options.getFocused();
//     const guild = await findGuild(interaction.guild);
//     let tags = guild.autoTags;

//     const filtered = Array.from(tags).filter(([key, _value]) =>
//       key.startsWith(focusedValue)
//     );

//     if (!filtered.length && focusedValue.length === 0) {
//       return await interaction.respond(
//         Array.from(tags).map(([key, _value]) => ({ name: key, value: key }))
//       );
//     }

//     return await interaction.respond(
//       filtered.map(([key, _value]) => ({ name: key, value: key }))
//     );
//   },
