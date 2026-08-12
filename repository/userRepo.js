const db = require("../models/index");

exports.createUser = async (data) => {
  return await db.userModel.create(data);
};

exports.findUserByEmail = async (email) => {
  return await db.userModel.findOne({
    where: { email: email.toLowerCase() },
  });
};

exports.findUserByResetToken = async (resetToken) => {
  return await db.userModel.findOne({
    where: { resetToken },
  });
};

exports.updateUser = async (userId, updateData) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  return await user.update(updateData);
};








