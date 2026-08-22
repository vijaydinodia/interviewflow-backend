const os = require("os");
const { sessionModel, userModel } = require("../models");
const { Op } = require("sequelize");

/**
 * Record a new login session into MySQL database table 'sessions' using Node.js 'os' module
 */
exports.recordLoginSession = async (user, req = {}) => {
  try {
    // Extract system OS & hostname metadata via Node.js 'os' module
    const serverHostname = os.hostname();
    const serverOsType = `${os.type()} ${os.release()} (${os.arch()})`;

    // Extract client request IP and user-agent details
    const clientIp =
      req.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers?.["user-agent"] || "Mozilla/5.0";

    const newSession = await sessionModel.create({
      userId: user.userId || user.user_id,
      userEmail: user.email,
      userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email,
      userRole: user.role || "candidate",
      ipAddress: clientIp,
      userAgent: userAgent,
      serverHostname: serverHostname,
      serverOs: serverOsType,
      loginTime: new Date(),
      lastActiveTime: new Date(),
      status: "active",
    });

    return newSession;
  } catch (err) {
    console.error("Error recording database login session:", err.message);
    if (err.message && err.message.includes("doesn't exist")) {
      try {
        await sessionModel.sync();
      } catch (sErr) {}
    }
    return null;
  }
};

/**
 * Get sessions from MySQL database for regular user — ONLY self login sessions
 */
exports.getUserSessions = async (userId, userEmail) => {
  try {
    const where = {};
    if (userId && userEmail) {
      where[Op.or] = [{ userId }, { userEmail }];
    } else if (userId) {
      where.userId = userId;
    } else if (userEmail) {
      where.userEmail = userEmail;
    }

    let sessions = await sessionModel.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Auto-record active session for current user if none exists in DB yet
    if (sessions.length === 0 && (userId || userEmail)) {
      const user = await userModel.findOne({
        where: userId ? { userId } : { email: userEmail },
      });
      if (user) {
        await exports.recordLoginSession(user);
        sessions = await sessionModel.findAll({
          where,
          order: [["createdAt", "DESC"]],
        });
      }
    }

    return sessions;
  } catch (err) {
    console.error("Error fetching user database sessions:", err.message);
    if (err.message && err.message.includes("doesn't exist")) {
      await sessionModel.sync();
    }
    return [];
  }
};

/**
 * Get ALL login sessions from MySQL database — for Super Admin view
 */
exports.getAllSessions = async () => {
  try {
    let sessions = await sessionModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    // If no active session records exist in MySQL yet, create session entries for active DB users
    if (sessions.length === 0) {
      const activeUsers = await userModel.findAll({ where: { isActive: true } });
      for (const u of activeUsers) {
        await exports.recordLoginSession(u);
      }
      sessions = await sessionModel.findAll({
        order: [["createdAt", "DESC"]],
      });
    }

    return sessions;
  } catch (err) {
    console.error("Error fetching all database sessions:", err.message);
    if (err.message && err.message.includes("doesn't exist")) {
      await sessionModel.sync();
    }
    return [];
  }
};

/**
 * Terminate a login session by ID in MySQL database
 */
exports.terminateSession = async (sessionId, requestingUser) => {
  try {
    const session = await sessionModel.findByPk(sessionId);
    if (!session) {
      return { success: false, statusCode: 404, message: "Session not found." };
    }

    const isSuperAdmin = requestingUser?.role?.toLowerCase().includes("admin");
    const isOwner =
      session.userId === requestingUser?.userId ||
      session.userEmail?.toLowerCase() === requestingUser?.email?.toLowerCase();

    if (!isSuperAdmin && !isOwner) {
      return { success: false, statusCode: 403, message: "Unauthorized to terminate this session." };
    }

    session.status = "terminated";
    await session.save();

    return {
      success: true,
      statusCode: 200,
      message: "Session terminated successfully.",
      session,
    };
  } catch (err) {
    console.error("Error terminating database session:", err.message);
    return { success: false, statusCode: 500, message: err.message || "Failed to terminate session." };
  }
};
