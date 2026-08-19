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

exports.getAllCompanies = async () => {
  const Sequelize = require("sequelize");
  return await db.userModel.findAll({
    where: {
      role: {
        [Sequelize.Op.in]: ["admin", "company"],
      },
    },
    include: [
      {
        model: db.profileModel,
        as: "profile",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.softDeleteUser = async (userId) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  return await user.update({ isActive: false });
};

exports.hardDeleteUser = async (userId) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  await user.destroy();
  return user;
};

exports.getAllUsers = async () => {
  return await db.userModel.findAll({
    include: [
      {
        model: db.profileModel,
        as: "profile",
        required: false,
      },
      {
        model: db.companyModel,
        as: "companyProfile",
        required: false,
      },
      {
        model: db.interviewerModel,
        as: "interviewerProfile",
        required: false,
        include: [
          {
            model: db.companyModel,
            as: "company",
            required: false,
          },
        ],
      },
      {
        model: db.candidateModel,
        as: "candidateProfile",
        required: false,
      },
      {
        model: db.superAdminModel,
        as: "superAdminProfile",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.restoreUser = async (userId) => {
  const user = await db.userModel.findByPk(userId);
  if (!user) return null;
  return await user.update({ isActive: true });
};
