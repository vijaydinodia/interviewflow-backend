const bugReportRepo = require("../repository/bugReportRepo");

exports.submitBugReport = async (reportData) => {
  if (!reportData.title || !reportData.description) {
    throw new Error("Title and description are required for bug submission.");
  }
  return await bugReportRepo.createBugReport(reportData);
};

exports.getAllBugReports = async () => {
  return await bugReportRepo.getAllBugReports();
};

exports.getUserBugReports = async (userId, userEmail) => {
  return await bugReportRepo.getUserBugReports(userId, userEmail);
};

exports.updateBugStatus = async (bugId, status) => {
  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }
  return await bugReportRepo.updateBugReportStatus(bugId, status);
};

exports.deleteBugReport = async (bugId) => {
  return await bugReportRepo.deleteBugReport(bugId);
};
