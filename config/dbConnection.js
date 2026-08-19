const mysql2 = require("mysql2/promise");
const db = require("../models");

const dbConnect = async () => {
  try {
    const connection = await mysql2.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      connectTimeout: 3000,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "interviewflow"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`Database '${process.env.DB_NAME || "interviewflow"}' ready.`);
    await connection.end();

    await db.sequelize.authenticate();
    console.log("DB is connected successfully");

    try {
      await db.sequelize.sync();
      console.log("DB schema synced successfully");
    } catch (syncErr) {
      console.warn("DB sync note:", syncErr.message);
    }
  } catch (err) {
    console.warn("Database Connection Note:", err.message);
  }
};

module.exports = dbConnect;

