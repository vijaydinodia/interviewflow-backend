const db = require("../models/index");

exports.findInterviewerByUserId = async (userId) => {
  return await db.interviewerModel.findOne({
    where: { userId },
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
  });
};

exports.createInterviewer = async (data) => {
  return await db.interviewerModel.create(data);
};

exports.updateInterviewer = async (userId, updateData) => {
  const interviewer = await db.interviewerModel.findOne({ where: { userId } });
  if (!interviewer) return null;
  return await interviewer.update(updateData);
};

exports.getAllInterviewers = async () => {
  return await db.interviewerModel.findAll({
    include: [{ model: db.userModel, as: "user", attributes: { exclude: ["password"] } }],
    order: [["createdAt", "DESC"]],
  });
};
