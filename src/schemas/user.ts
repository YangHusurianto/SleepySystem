import { IInfraction, infractionSchema } from './infraction.ts';
import { INote, noteSchema } from './note.ts';

import { Schema, model, Document } from 'mongoose';


export interface IUser extends Document {
  userId: String,
  guildId: String,
  verified: Boolean,
  verifiedBy: String,
  notes: [INote],
  infractions: [IInfraction],
  roles: [String],
  muted: Boolean,
}

const userSchema = new Schema<IUser>({
  userId: String,
  guildId: String,
  verified: Boolean,
  verifiedBy: String,
  notes: [noteSchema],
  infractions: [infractionSchema],
  roles: [String],
  muted: Boolean,
});

export default model<IUser>('User', userSchema, 'users');
