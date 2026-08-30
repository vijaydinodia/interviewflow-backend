const mysql2 = require("mysql2/promise");
const db = require("../models");

const dbConnect = async () => {
  const isSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";

  // Step 1: Raw connection for database creation if using local MySQL
  try {
    const connection = await mysql2.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 10000,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "interviewflow"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`Database '${process.env.DB_NAME || "interviewflow"}' ready.`);
    await connection.end();
  } catch (rawConnErr) {
    console.log("Raw DB init note (cloud DB managed database active):", rawConnErr.message);
  }

  // Step 2: Authenticate and sync Sequelize models
  try {
    await db.sequelize.authenticate();
    console.log("DB is connected successfully to Production / Cloud DB");

    await db.sequelize.sync();
    
    try {
      await db.bugReportModel.sync();
      await db.sessionModel.sync();
    } catch (bugSyncErr) {
      await db.sequelize.query("DROP TABLE IF EXISTS `bug_reports`;");
      await db.bugReportModel.sync();
      await db.sessionModel.sync();
    }
    console.log("DB schema, bug_reports, and sessions tables synced successfully");

    // Safe schema adjustments for interview_requests
    try {
      const [existingCols] = await db.sequelize.query("SHOW COLUMNS FROM `interview_requests`;");
      const colNames = existingCols.map((c) => c.Field);

      if (!colNames.includes("request_type")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `request_type` VARCHAR(20) DEFAULT 'direct';");
      }
      if (!colNames.includes("meeting_link")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `meeting_link` VARCHAR(255) NULL;");
      }
      if (!colNames.includes("candidate_notes")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `candidate_notes` TEXT NULL;");
      }
      if (!colNames.includes("topic_focus")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `topic_focus` JSON NULL;");
      }
      if (!colNames.includes("scheduled_date")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `scheduled_date` VARCHAR(50) NULL;");
      }
      if (!colNames.includes("scheduled_time")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `scheduled_time` VARCHAR(50) NULL;");
      }
      if (!colNames.includes("room_code")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `room_code` VARCHAR(50) NOT NULL;");
      }
      if (!colNames.includes("role_requirement")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `role_requirement` VARCHAR(150) NOT NULL;");
      }
      if (!colNames.includes("language")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `language` VARCHAR(50) NULL;");
      }
      if (!colNames.includes("status")) {
        await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `status` ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending';");
      }

      await db.sequelize.query("ALTER TABLE `interview_requests` MODIFY `interviewer_user_id` CHAR(36) NULL;");
      console.log("interview_requests schema fully verified and synchronized.");
    } catch (alterErr) {
      console.warn("DB migration note:", alterErr.message);
    }

    // Add OTP columns to users table if they don't exist
    try {
      const [userCols] = await db.sequelize.query("SHOW COLUMNS FROM `users`;");
      const userColNames = userCols.map((c) => c.Field);
      if (!userColNames.includes("otp_code")) {
        await db.sequelize.query("ALTER TABLE `users` ADD COLUMN `otp_code` VARCHAR(6) NULL;");
        console.log("Added otp_code column to users table.");
      }
      if (!userColNames.includes("otp_expires")) {
        await db.sequelize.query("ALTER TABLE `users` ADD COLUMN `otp_expires` DATETIME NULL;");
        console.log("Added otp_expires column to users table.");
      }
    } catch (otpMigErr) {
      console.warn("OTP column migration note:", otpMigErr.message);
    }

    // Ensure all companies table columns exist (safe migration)
    try {
      const [companyCols] = await db.sequelize.query("SHOW COLUMNS FROM `companies`;");
      const companyColNames = companyCols.map((c) => c.Field);

      const companyColumnMigrations = [
        { col: "tagline",          sql: "ALTER TABLE `companies` ADD COLUMN `tagline` VARCHAR(255) NULL;" },
        { col: "website",          sql: "ALTER TABLE `companies` ADD COLUMN `website` VARCHAR(255) NULL;" },
        { col: "industry",         sql: "ALTER TABLE `companies` ADD COLUMN `industry` VARCHAR(100) NULL;" },
        { col: "company_size",     sql: "ALTER TABLE `companies` ADD COLUMN `company_size` VARCHAR(100) NULL;" },
        { col: "location",         sql: "ALTER TABLE `companies` ADD COLUMN `location` VARCHAR(255) NULL;" },
        { col: "contact_phone",    sql: "ALTER TABLE `companies` ADD COLUMN `contact_phone` VARCHAR(20) NULL;" },
        { col: "contact_email",    sql: "ALTER TABLE `companies` ADD COLUMN `contact_email` VARCHAR(255) NULL;" },
        { col: "logo_url",         sql: "ALTER TABLE `companies` ADD COLUMN `logo_url` TEXT NULL;" },
        { col: "verification_doc", sql: "ALTER TABLE `companies` ADD COLUMN `verification_doc` VARCHAR(255) NULL;" },
        { col: "is_verified",      sql: "ALTER TABLE `companies` ADD COLUMN `is_verified` TINYINT(1) DEFAULT 0;" },
      ];

      for (const { col, sql } of companyColumnMigrations) {
        if (!companyColNames.includes(col)) {
          await db.sequelize.query(sql);
          console.log(`Added missing column '${col}' to companies table.`);
        }
      }
      console.log("companies table schema verified.");
    } catch (companyMigErr) {
      console.warn("companies table migration note:", companyMigErr.message);
    }
  } catch (err) {
    console.error("Database Connection Error:", err.message);
  }
};

module.exports = dbConnect;
