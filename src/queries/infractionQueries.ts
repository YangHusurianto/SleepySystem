import User from '../schemas/user.ts';

export async function updateInfraction(
  guildId: string,
  infractionNumber: string,
  reason: string,
  notes:string
) {
  try {
    let UserDoc = await User.findOne({
      guildId: guildId,
      'infractions.number': infractionNumber,
    });

    if (!UserDoc) {
      return null;
    }

    if (!reason) reason = UserDoc.infractions[0].reason || '';

    return await User.findOneAndUpdate(
      {
        guildId: guildId,
        'infractions.number': infractionNumber,
      },
      {
        $set: {
          'infractions.$.reason': reason,
          'infractions.$.moderatorNotes': notes,
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error(error);
  }
}

export async function removeInfraction(userId: string, guildId: string, infractionNumber: number) {
  try {
    return await User.findOneAndUpdate(
      { userId: userId, guildId: guildId },
      {
        $pull: {
          infractions: { number: infractionNumber },
        },
      }
    );
  } catch (error) {
    console.error(error);
  }
}

export async function findInfraction(guildId: string, infractionNumber: number) {
  try {
    return await User.findOne({
      guildId: guildId,
      'infractions.number': infractionNumber,
    });
  } catch (error) {
    console.error(error);
  }
}
