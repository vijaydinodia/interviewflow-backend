const db = require("../models/index");

exports.findCandidateByUserId = async (userId) => {
  return await db.candidateModel.findOne({
    where: { userId },
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.findCandidateById = async (candidateId) => {
  return await db.candidateModel.findByPk(candidateId, {
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.createCandidate = async (data) => {
  return await db.candidateModel.create(data);
};

exports.updateCandidate = async (userId, updateData) => {
  const candidate = await db.candidateModel.findOne({ where: { userId } });
  if (!candidate) return null;
  return await candidate.update(updateData);
};

exports.getAllCandidates = async () => {
  return await db.candidateModel.findAll({
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
    order: [["createdAt", "DESC"]],
  });
};

exports.deleteCandidate = async (userId) => {
  const candidate = await db.candidateModel.findOne({ where: { userId } });
  if (!candidate) return null;
  await candidate.destroy();
  return candidate;
};
