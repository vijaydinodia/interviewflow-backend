const db = require("../models/index");

exports.createSuperAdmin = async (data) => {
  return await db.superAdminModel.create(data);
};

exports.getSuperAdminById = async (superadminId) => {
  return await db.superAdminModel.findByPk(superadminId, {
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.getSuperAdminByUserId = async (userId) => {
  return await db.superAdminModel.findOne({
    where: { userId },
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.getAllSuperAdmins = async () => {
  return await db.superAdminModel.findAll({
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.updateSuperAdmin = async (superadminId, updateData) => {
  const superAdmin = await db.superAdminModel.findByPk(superadminId);
  if (!superAdmin) return null;
  return await superAdmin.update(updateData);
};

exports.deleteSuperAdmin = async (superadminId) => {
  const superAdmin = await db.superAdminModel.findByPk(superadminId);
  if (!superAdmin) return null;
  await superAdmin.destroy();
  return superAdmin;
};
