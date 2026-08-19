const sequelize = require("../config/dbConfig");

const userModel = require("./userModel")(sequelize);
const superAdminModel = require("./superAdminModel")(sequelize);
const profileModel = require("./profileModel")(sequelize);
const companyModel = require("./comapanyModel")(sequelize);
const interviewerModel = require("./interviewerModel")(sequelize);
const candidateModel = require("./candidateModel")(sequelize);
const interviewRequestModel = require("./interviewRequestModel")(sequelize);

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

module.exports = {
  sequelize,
  userModel,
  superAdminModel,
  profileModel,
  companyModel,
  interviewerModel,
  candidateModel,
  interviewRequestModel,
};
