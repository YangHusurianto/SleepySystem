import { ExtendedClient } from '../../structures/Client.ts';
import { SlashCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';
import { allChecks } from '../../utils/checks.ts';
import { findGuild } from '../../queries/guildQueries.ts';
import { IGuild } from '../../schemas/guild.ts';
import { findAndCreateUser } from '../../queries/userQueries.ts';
import { logAction } from '../../utils/logs.ts';

import {
  ApplicationCommandOptionType,
  escapeMarkdown,
  Guild,
  GuildMember,
  User,
} from 'discord.js';


export default new SlashCommand({
  name: 'ban',
  description: 'Ban a user and send them a dm with the reason',
  dmPermission: false,
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: 'user',
      description: 'The user to ban',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'reason',
      description: 'The reason for the ban',
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

    interaction.deferReply();

    if (await allChecks(interaction, client, guild, target, member, 'ban'))
      return;

    banUser(interaction, client, guild, target, member, reason);
  },
});

async function banUser(
  interaction: ExtendedInteraction,
  client: ExtendedClient,
  guild: Guild,
  target: User,
  member: GuildMember,
  reason: string
) {
  const guildDoc = (await findGuild(guild)) as IGuild;
  // pull the tags list and convert to value
  let tags = guildDoc.tags;
  reason = tags.get(reason) ?? reason;

  // create the ban first so we can insert regardless of whether the user exists
  const ban = {
    guildId: guild.id,
    targetUserId: target.id,
    type: 'BAN',
    number: guildDoc.caseNumber,
    reason: reason,
    date: new Date(),
    duration: '0',
    moderatorUserId: member.user.id,
  };

  let userDoc = await findAndCreateUser(guild.id, target.id);
  userDoc.infractions.push(ban);

  await client.users
    .send(
      target.id,
      `You have been banned from ${guild.name}.\n` +
        `**Reason:** ${reason}\n\n` +
        'If you feel this ban was not fair or made in error,' +
        `please create a ticket in the unban server at https://discord.gg/${guildDoc.settings.get(
          'unbanServer'
        )}`
    )
    .catch((err) => {
      console.log('Failed to dm user about ban.');
      console.error(err);
    });

  await guild.members
    .ban(target.id, { reason: reason })
    .then(async () => {
      let banConfirmation = `<:check:1196693134067896370> ${target} has been banned.`;

      if (interaction.replied || interaction.deferred)
        await interaction.editReply(banConfirmation);
      else await interaction.reply(banConfirmation);
    })
    .catch(console.error);

  guildDoc.incrementCaseNumber();
  await guildDoc.save().catch(async (err) => {
    await interaction.reply(`:x: Failed to update case number.`);
    console.error(err);
  });

  await userDoc.save().catch(async (err) => {
    await interaction.reply(`:x: Failed to save ban.`);
    console.error(err);
  });

  //log to channel
  logAction(
    guild,
    false,
    `**BAN** | Case #${guildDoc.caseNumber}\n` +
      `**Target:** ${escapeMarkdown(`${target.username} (${target.id}`, {
        inlineCode: true,
      })})\n` +
      `**Moderator:** ${escapeMarkdown(
        `${member.user.username} (${member.user.id}`,
        { inlineCode: true }
      )})\n` +
      `**Reason:** ${reason}\n`
  );
}
