import { Model, Schema, model, Document } from 'mongoose';

export interface IGuild extends Document {
  guildId: string,
  guildName: string,
  guildIcon: string,
  caseNumber: Number,
  autoTags: Map<string, string>,
  channelTags: Map<string, string>,
  settings: Map<string, string>,
  settingsMap: Map<string, Map<string, string>>,

  incrementCaseNumber(): void;
}

interface IGuildMethods {
  incrementCaseNumber(): void;
}

export type GuildModel = Model<IGuild, {}, IGuildMethods>;

const guildSchema = new Schema<IGuild, GuildModel, IGuildMethods>({
  guildId: String,
  guildName: String,
  guildIcon: String,
  caseNumber: Number,
  autoTags: { type: Map, of: String },
  channelTags: { type: Map, of: String },
  settings: { type: Map, of: String },
  settingsMap: { type: Map, of: Map },
});

guildSchema.method('incrementCaseNumber', function incrementCaseNumber() {
  this.caseNumber = this.caseNumber ? Number(this.caseNumber) + 1 : 1;
});

export default model<IGuild, GuildModel>('Guild', guildSchema, 'guilds');
