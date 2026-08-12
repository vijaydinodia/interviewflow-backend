const db = require("../models");

const dbConnect = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("DB is connected");
    await db.sequelize.sync({ alter: true });
    console.log("DB schema synced (alter: true)");
  } catch (err) {
    console.log("DB error:", err);
    throw err;
  }
};

module.exports = dbConnect;
