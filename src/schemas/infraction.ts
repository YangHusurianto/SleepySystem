import { Schema } from 'mongoose';

export interface IInfraction {
  targetUserId: string;
  type: string;
  number: Number;
  reason: string;
  date: Date;
  duration: string;
  moderatorUserId: string;
}

export const infractionSchema = new Schema<IInfraction>({
  targetUserId: String,
  type: String,
  number: Number,
  reason: String,
  date: Date,
  duration: String,
  moderatorUserId: String,
});
