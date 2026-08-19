const db = require("../models/index");

exports.findCompanyByUserId = async (userId) => {
  return await db.companyModel.findOne({
    where: { userId },
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.createCompany = async (data) => {
  return await db.companyModel.create(data);
};

exports.updateCompany = async (userId, updateData) => {
  const company = await db.companyModel.findOne({ where: { userId } });
  if (!company) return null;
  return await company.update(updateData);
};

exports.getAllCompanies = async () => {
  return await db.companyModel.findAll({
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
    order: [["createdAt", "DESC"]],
  });
};
