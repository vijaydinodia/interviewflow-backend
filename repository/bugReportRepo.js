const { bugReportModel } = require("../models");

exports.createBugReport = async (data) => {
  try {
    return await bugReportModel.create(data);
  } catch (err) {
    if (err.message && (err.message.includes("doesn't exist") || err.message.includes("foreign key constraint") || err.message.includes("incompatible"))) {
      try {
        await bugReportModel.sync();
      } catch (sErr) {
        const { sequelize } = require("../models");
        await sequelize.query("DROP TABLE IF EXISTS `bug_reports`;");
        await bugReportModel.sync();
      }
      return await bugReportModel.create(data);
    }
    throw err;
  }
};

exports.getAllBugReports = async () => {
  try {
    return await bugReportModel.findAll({
      order: [["createdAt", "DESC"]],
    });
  } catch (err) {
    console.error("getAllBugReports error:", err.message);
    if (err.message && err.message.includes("doesn't exist")) {
      await bugReportModel.sync();
      return [];
    }
    throw err;
  }
};

exports.getUserBugReports = async (userId, userEmail) => {
  try {
    const { Op } = require("sequelize");
    const where = {};
    if (userId && userEmail) {
      where[Op.or] = [{ userId }, { userEmail }];
    } else if (userId) {
      where.userId = userId;
    } else if (userEmail) {
      where.userEmail = userEmail;
    }

    return await bugReportModel.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
  } catch (err) {
    if (err.message && err.message.includes("doesn't exist")) {
      await bugReportModel.sync();
      return [];
    }
    throw err;
  }
};

exports.updateBugReportStatus = async (bugId, status) => {
  const bug = await bugReportModel.findByPk(bugId);
  if (!bug) return null;
  bug.status = status;
  await bug.save();
  return bug;
};

exports.deleteBugReport = async (bugId) => {
  return await bugReportModel.destroy({ where: { bugId } });
};
