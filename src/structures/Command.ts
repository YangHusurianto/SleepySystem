import { CommandType, MessageContextMenuCommandType } from "../typings/Command.ts";

export class SlashCommand {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}

export class MessageContextMenuCommand {
  constructor(commandOptions: MessageContextMenuCommandType) {
    Object.assign(this, commandOptions);
  }
}