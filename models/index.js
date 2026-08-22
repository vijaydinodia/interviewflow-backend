const sequelize = require("../config/dbConfig");

const userModel = require("./userModel")(sequelize);
const superAdminModel = require("./superAdminModel")(sequelize);
const profileModel = require("./profileModel")(sequelize);
const companyModel = require("./comapanyModel")(sequelize);
const interviewerModel = require("./interviewerModel")(sequelize);
const candidateModel = require("./candidateModel")(sequelize);
const interviewRequestModel = require("./interviewRequestModel")(sequelize);
const meetingLinkModel = require("./meetingLinkModel")(sequelize);
const codeExecutionModel = require("./codeExecutionModel")(sequelize);
const bugReportModel = require("./bugReportModel")(sequelize);
const sessionModel = require("./sessionModel")(sequelize);

userModel.hasOne(superAdminModel, { foreignKey: "userId", as: "superAdminProfile" });
superAdminModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

userModel.hasOne(profileModel, { foreignKey: "userId", as: "profile" });
profileModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

userModel.hasOne(companyModel, { foreignKey: "userId", as: "companyProfile" });
companyModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

userModel.hasOne(interviewerModel, { foreignKey: "userId", as: "interviewerProfile" });
interviewerModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

companyModel.hasMany(interviewerModel, { foreignKey: "companyId", as: "interviewers" });
interviewerModel.belongsTo(companyModel, { foreignKey: "companyId", as: "company" });

userModel.hasOne(candidateModel, { foreignKey: "userId", as: "candidateProfile" });
candidateModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

userModel.hasMany(interviewRequestModel, { foreignKey: "candidateUserId", as: "candidateInterviewRequests" });
interviewRequestModel.belongsTo(userModel, { foreignKey: "candidateUserId", as: "candidateUser" });

userModel.hasMany(interviewRequestModel, { foreignKey: "interviewerUserId", as: "interviewerInterviewRequests" });
interviewRequestModel.belongsTo(userModel, { foreignKey: "interviewerUserId", as: "interviewerUser" });

interviewRequestModel.hasOne(meetingLinkModel, { foreignKey: "assignedRequestId", as: "meetingDetails" });
meetingLinkModel.belongsTo(interviewRequestModel, { foreignKey: "assignedRequestId", as: "interviewRequest" });

userModel.hasMany(codeExecutionModel, { foreignKey: "userId", as: "codeExecutions" });
codeExecutionModel.belongsTo(userModel, { foreignKey: "userId", as: "user" });

userModel.hasMany(bugReportModel, { foreignKey: "userId", as: "bugReports", constraints: false });
bugReportModel.belongsTo(userModel, { foreignKey: "userId", as: "user", constraints: false });

userModel.hasMany(sessionModel, { foreignKey: "userId", as: "sessions", constraints: false });
sessionModel.belongsTo(userModel, { foreignKey: "userId", as: "user", constraints: false });

module.exports = {
  sequelize,
  userModel,
  superAdminModel,
  profileModel,
  companyModel,
  interviewerModel,
  candidateModel,
  interviewRequestModel,
  meetingLinkModel,
  codeExecutionModel,
  bugReportModel,
  sessionModel,
};
