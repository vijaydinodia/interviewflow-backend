const db = require("../models/index");

exports.getProfileByUserId = async (userId) => {
  return await db.profileModel.findOne({ where: { userId } });
};

exports.createProfile = async (data) => {
  return await db.profileModel.create(data);
};

exports.updateProfile = async (userId, updateData) => {
  const profile = await db.profileModel.findOne({ where: { userId } });
  if (!profile) return null;
  return await profile.update({ ...updateData, profileUpdatedAt: new Date() });
};

exports.upsertProfile = async (userId, data) => {
  const existing = await db.profileModel.findOne({ where: { userId } });
  if (existing) {
    return await existing.update({ ...data, profileUpdatedAt: new Date() });
  }
  return await db.profileModel.create({ ...data, userId, profileUpdatedAt: new Date() });
};
