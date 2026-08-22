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
      try {
        await db.bugReportModel.sync();
      } catch (bugSyncErr) {
        await db.sequelize.query("DROP TABLE IF EXISTS `bug_reports`;");
        await db.bugReportModel.sync();
      }
      console.log("DB schema and bug_reports table synced successfully");

      // Safe schema adjustments for open matching requests
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
    } catch (syncErr) {
      console.warn("DB sync note:", syncErr.message);
    }
  } catch (err) {
    console.warn("Database Connection Note:", err.message);
  }
};

module.exports = dbConnect;

