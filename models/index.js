const sequelize = require("../config/dbConfig");
const userModel = require("./userModel")(sequelize);;

module.exports = {
  sequelize,
  userModel,
};
