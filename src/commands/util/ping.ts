import { SlashCommand } from "../../structures/Command.ts";

export default new SlashCommand({
  name: "ping",
  description: "Pong!",
  run: async({ interaction }: { interaction: any }) => {
    interaction.reply("Pong!");
  }
})