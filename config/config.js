require("dotenv").config();

const config = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  DB: process.env.DB_NAME || "interviewflow",
  PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DIALECT: process.env.DB_DIALECT || "mysql",
  SSL: process.env.DB_SSL === "true" || process.env.DB_SSL === "1" || Boolean(process.env.DB_SSL),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = config;
