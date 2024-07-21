import User, { IUser } from '../schemas/user.ts';

import mongoose from 'mongoose';

export async function updateUser(guildId:string, userId:string, update: {}) {
  return await User.findOneAndUpdate(
    { guildId: guildId, userId: userId },
    update,
    { new: true }
  );
}

export async function getRecentByModerator(guildId:string, userId:string, timeLimit: number, type: string) {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  return await User.aggregate([
    { $match: { guildId: guildId } },
    { $unwind: '$infractions' },
    {
      $match: {
        'infractions.date': { $gte: afterDate },
        'infractions.type': type,
        'infractions.moderatorUserId': userId,
      },
    },
    { $project: { _id: 0, infractions: '$infractions' } },
  ]);
}

export async function getRecentByUser(guildId:string, userId:string, timeLimit: number) {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - timeLimit);

  return await User.aggregate([
    { $match: { guildId: guildId, userId: userId } },
    { $unwind: '$infractions' },
    { $match: { 'infractions.date': { $gte: afterDate } } },
    { $project: { _id: 0, infractions: '$infractions' } },
  ]);
}

export async function findUser(guildId:string, userId:string): Promise<IUser | null> {
  return await User.findOne({ guildId: guildId, userId: userId });
}

export async function findAndCreateUser(guildId:string, userId:string) {
  return await User.findOneAndUpdate(
    { userId: userId, guildId: guildId },
    {
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        guildId: guildId,
        verified: false,
        verifiedBy: '',
        notes: [],
        infractions: [],
        roles: [],
      },
    },
    { upsert: true, new: true }
  );
}

export async function getMutedUsers() {
  return await User .aggregate([
    { $match: { muted: true } }, 
    { $unwind: '$infractions' }, 
    { $sort: { 'infractions.date': -1 } }, // Sort by date in descending order
    {
      $group: {
        _id: '$_id',
        // mostRecentInfraction: { $first: '$infractions' },
        user: { $first: '$$ROOT' },
      },
    },
    { 
      $match: {
        $expr: {
          $and: [
            { $ne: ['$user.infractions.duration', '0'] },
            { $lt: [{ $add: ['$user.infractions.date', { $toInt: '$user.infractions.duration' }] }, new Date()] }
          ]
        }
      }
    },
  ]);
}
