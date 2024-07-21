import { Schema } from 'mongoose';

export interface INote {
  guildId: String;
  targetUserId: String;
  noteNumber: Number;
  note: String;
  noteDate: Date;
  moderatorUserId: String;
}

export const noteSchema = new Schema<INote>({
  guildId: String,
  targetUserId: String,
  noteNumber: Number,
  note: String,
  noteDate: Date,
  moderatorUserId: String,
});
