const config = require("./config");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.DIALECT,
  pool: config.pool,
});

module.exports = sequelize;
