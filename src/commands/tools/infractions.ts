import { findAndCreateUser, findUser, getRecentByUser } from '../../queries/userQueries.ts';
import { SlashCommand } from '../../structures/Command.ts';
import { ExtendedInteraction } from '../../typings/Command.ts';

import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Embed,
  EmbedBuilder,
  escapeMarkdown,
  Guild,
  GuildMember,
  User,
} from 'discord.js';

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
  timeZoneName: 'short',
  timeZone: 'UTC',
};

const DETAILS_PER_PAGE = 5;

export default new SlashCommand({
  name: 'view',
  description: 'View information about a user',
  dmPermission: false,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'profile',
      description: "View a user's profile",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to view',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'infractions',
      description: "View a user's infractions",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to view',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'page',
          description: 'The page number to view',
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'notes',
      description: "View a user's notes",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to view',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'page',
          description: 'The page number to view',
        },
      ],
    },
  ],
  run: async ({ interaction }: { interaction: ExtendedInteraction }) => {
    const { options, guild } = interaction;

    const targetUser = interaction.options.getUser('user') as User;
    const targetGuildUser = await guild.members.fetch(targetUser.id);
    const pageNum = options.getInteger('page') ?? 1;

    const type = interaction.options.getSubcommand();

    var mainView,
      maxPages = 1;

    let viewReturn = await getViewEmbed(
      guild,
      interaction,
      targetGuildUser,
      pageNum,
      type,
      mainView,
      maxPages
    );

    if (!viewReturn) return;

    [mainView, maxPages] = viewReturn;

    getEmbedNavigation(
      guild,
      targetGuildUser,
      interaction,
      type,
      mainView,
      pageNum,
      maxPages
    );
  },
});

const getViewEmbed = async (
  guild: Guild,
  interaction: ExtendedInteraction,
  targetGuildUser: GuildMember,
  pageNum: number,
  type: string,
  mainView: any,
  maxPages: number
): Promise<[EmbedBuilder, number] | undefined> => {
  let infoReturn;
  switch (type) {
    case 'profile':
      mainView = getProfileEmbed(targetGuildUser);
      break;
    case 'infractions':
      infoReturn = await getInfoEmbed(
        guild,
        interaction,
        targetGuildUser,
        pageNum,
        'infractions'
      );

      if (!infoReturn) return undefined;

      [mainView, maxPages] = infoReturn;

      break;
    case 'notes':
      infoReturn = await getInfoEmbed(
        guild,
        interaction,
        targetGuildUser,
        pageNum,
        'notes'
      );

      if (!infoReturn) return undefined;

      [mainView, maxPages] = infoReturn;

      break;
  }

  return [mainView, maxPages];
};

const getProfileEmbed = (member: GuildMember) => {
  const profileEmbed = new EmbedBuilder()
    .setColor(member.displayHexColor)
    .setAuthor({
      name: `${member.user.username}`,
      iconURL: member.user.displayAvatarURL(),
    })
    .addFields(
      {
        name: 'User Information',
        value: `${escapeMarkdown(member.user.username)} (${member.user.id}) <@${
          member.user.id
        }>`,
      },
      {
        name: 'Roles',
        value: member.roles.cache.map((role) => role.toString()).join(', '),
      },
      {
        name: 'Joined Server',
        value: member.joinedAt
          ? `<t:${Math.round(member.joinedAt.getTime() / 1000)}:F>`
          : 'Unknown',
      },
      {
        name: 'Joined Discord',
        value: `<t:${Math.round(member.user.createdAt.getTime() / 1000)}:F>`,
      },
      {
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.user.id}\`\`\``,
      }
    )
    .setTimestamp();

  return profileEmbed;
};

const getInfoEmbed = async (
  guild: Guild,
  interaction: ExtendedInteraction,
  member: GuildMember,
  pageNum: number,
  type: string
): Promise<
  [EmbedBuilder, number] | undefined
> => {
  try {
    const userDoc = await findAndCreateUser(guild.id, member.id);

    console.log(userDoc);

    if (!userDoc) {
      interaction.reply({
        content: 'User not found in database.',
        ephemeral: true,
      });

      return undefined;
    }

    const info = userDoc.get(type);
    const maxPages = Math.ceil(info.length / DETAILS_PER_PAGE);

    if (pageNum > maxPages) pageNum = maxPages;

    if (!info.length) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${member.user.username} (${member.user.id})`,
          iconURL: member.user.displayAvatarURL(),
        })
        .addFields({
          name: `No ${type}`,
          value: '🎉',
        });

      return [embed, 1];
    }

    const recents = [
      {
        name: '1 Day',
        value: (await getRecentByUser(guild.id, member.id, 1)).length,
      },
      {
        name: '7 Days',
        value: (await getRecentByUser(guild.id, member.id, 7)).length,
      },
      {
        name: '30 Days',
        value: (await getRecentByUser(guild.id, member.id, 30)).length,
      },
    ];

    return [
      getInfoEmbedContent(member, pageNum, info, type, recents),
      maxPages,
    ];
  } catch (err) {
    console.error(err);
  }
};

const getInfoEmbedContent = (
  member: GuildMember,
  pageNum: number,
  info: any,
  type: string,
  recents: Array<{ name: string; value: number }>
) => {
  const embed = new EmbedBuilder().setAuthor({
    name: `${member.user.username} (${member.id})`,
    iconURL: member.displayAvatarURL(),
  });

  if (info.length > 5) {
    embed.setFooter({
      text: `Page ${pageNum}/${Math.ceil(info.length / 5)}`,
    });
  }

  embed.addFields({
    name: `**Total Infractions:** ${info.length}`,
    value:
      `Infractions within the last 24 hours: ${recents[0].value}\n` +
      `Infractions within the last 7 days: ${recents[1].value}\n` +
      `Infractions within the last 30 days: ${recents[2].value}`,
  });

  const startIndex = (pageNum - 1) * DETAILS_PER_PAGE;
  const endIndex =
    startIndex + DETAILS_PER_PAGE > info.length
      ? info.length
      : startIndex + DETAILS_PER_PAGE;

  for (const item of info.slice(startIndex, endIndex)) {
    const date = new Intl.DateTimeFormat('en-US', dateOptions).format(
      item.date
    );
    const moderator = item.moderatorUserId;

    if (type === 'infractions') {
      embed.addFields({
        name: `${item.type} | Case #${item.number}`,
        value:
          `**Reason:** ${item.reason}\n` +
          `**Moderator:** <@${moderator}> ${escapeMarkdown(`(${moderator})`, {
            inlineCode: true,
          })}\n` +
          `**Date:** ${date}`,
      });
    }

    if (type === 'notes') {
      embed.addFields({
        name: `**Notes** | Case #${item.noteNumber}`,
        value:
          `**Note:** ${item.note}\n` +
          `**Moderator:** <@${moderator}> ${escapeMarkdown(`(${moderator})`, {
            inlineCode: true,
          })}\n` +
          `**Date:** ${date}`,
      });
    }
  }

  return embed;
};

const getEmbedNavigation = async (
  guild: Guild,
  targetGuildUser: GuildMember,
  interaction: ExtendedInteraction,
  type: string,
  mainView: EmbedBuilder,
  pageNum: number,
  maxPages: number
) => {
  const createButton = (
    customId: string,
    label: string,
    style: ButtonStyle
  ) => {
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style);
  };

  const previousPage = createButton('previous', '◀', ButtonStyle.Primary);
  const nextPage = createButton('next', '▶', ButtonStyle.Primary);
  const profileButton = createButton(
    'profile',
    'Profile',
    ButtonStyle.Secondary
  );
  const infractionsButton = createButton(
    'infractions',
    'Infractions',
    ButtonStyle.Secondary
  );
  const notesButton = createButton('notes', 'Notes', ButtonStyle.Secondary);

  const pageControls = new ActionRowBuilder<ButtonBuilder>().addComponents(
    previousPage,
    nextPage,
    profileButton,
    infractionsButton,
    notesButton
  );

  if (pageNum == 1) previousPage.setDisabled(true);
  if (pageNum == maxPages) nextPage.setDisabled(true);
  switch (type) {
    case 'profile':
      profileButton.setDisabled(true);
      break;
    case 'infractions':
      infractionsButton.setDisabled(true);
      break;
    case 'notes':
      notesButton.setDisabled(true);
      break;
  }

  const response = await interaction.reply({
    embeds: [mainView],
    components: [pageControls],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 600_000,
  });

  let viewReturn;
  collector.on('collect', async (i: any) => {
    switch (i.customId) {
      case 'previous':
        nextPage.setDisabled(false);
        if (--pageNum - 1 == 1) previousPage.setDisabled(true);

        viewReturn = await getViewEmbed(
          guild,
          interaction,
          targetGuildUser,
          pageNum,
          'infractions',
          mainView,
          maxPages
        );

        if (!viewReturn) return;

        [mainView, maxPages] = viewReturn;

        await i.update({
          embeds: [mainView],
          components: [pageControls],
        });
        break;
      case 'next':
        previousPage.setDisabled(false);
        if (++pageNum == maxPages) nextPage.setDisabled(true);

        viewReturn = await getViewEmbed(
          guild,
          interaction,
          targetGuildUser,
          pageNum,
          'infractions',
          mainView,
          maxPages
        );

        if (!viewReturn) return;

        [mainView, maxPages] = viewReturn;

        await i.update({
          embeds: [mainView],
          components: [pageControls],
        });
        break;
      case 'profile':
        profileButton.setDisabled(true);
        infractionsButton.setDisabled(false);
        notesButton.setDisabled(false);
        nextPage.setDisabled(true);
        previousPage.setDisabled(true);

        viewReturn = await getViewEmbed(
          guild,
          interaction,
          targetGuildUser,
          pageNum,
          'profile',
          mainView,
          maxPages
        );

        if (!viewReturn) return;

        [mainView, maxPages] = viewReturn;

        await i.update({
          embeds: [mainView],
          components: [pageControls],
        });
        break;
      case 'infractions':
        profileButton.setDisabled(false);
        infractionsButton.setDisabled(true);
        notesButton.setDisabled(false);
        nextPage.setDisabled(false);
        previousPage.setDisabled(false);

        pageNum = 1;
        viewReturn = await getViewEmbed(
          guild,
          interaction,
          targetGuildUser,
          pageNum,
          'infractions',
          mainView,
          maxPages
        );

        if (!viewReturn) return;

        [mainView, maxPages] = viewReturn;

        if (pageNum == 1) previousPage.setDisabled(true);
        if (pageNum == maxPages) nextPage.setDisabled(true);

        await i.update({
          embeds: [mainView],
          components: [pageControls],
        });
        break;
      case 'notes':
        profileButton.setDisabled(false);
        infractionsButton.setDisabled(false);
        notesButton.setDisabled(true);
        nextPage.setDisabled(false);
        previousPage.setDisabled(false);

        pageNum = 1;
        viewReturn = await getViewEmbed(
          guild,
          interaction,
          targetGuildUser,
          pageNum,
          'notes',
          mainView,
          maxPages
        );

        if (!viewReturn) return;

        [mainView, maxPages] = viewReturn;

        if (pageNum == 1) previousPage.setDisabled(true);
        if (pageNum == maxPages) nextPage.setDisabled(true);

        await i.update({
          embeds: [mainView],
          components: [pageControls],
        });
    }
  });
};
