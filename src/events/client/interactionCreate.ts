import { CommandInteractionOptionResolver } from "discord.js";
import { client } from "../../index.ts";
import { Event } from "../../structures/Event.ts";
import { ExtendedInteraction } from "../../typings/Command.ts";

export default new Event("interactionCreate", async (interaction) => {
    // Chat Input Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          console.error(`Command ${interaction.commandName} not found`);
          return;
        }

        command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client,
            interaction: interaction as ExtendedInteraction
        });
    }
});