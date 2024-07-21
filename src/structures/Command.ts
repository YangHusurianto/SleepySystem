import { CommandType } from "../typings/Command.ts";

export class Command {
  constructor(commandOptions: CommandType) {
    Object.assign(this, commandOptions);
  }
}