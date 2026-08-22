const sessionService = require("../services/sessionService");

/**
 * GET /api/sessions/my-sessions
 * Regular users view ONLY their self login sessions
 */
exports.getMySessions = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.userId;
    const userEmail = req.user?.email || req.query.userEmail;

    if (!userId && !userEmail) {
      return res.status(400).json({
        success: false,
        message: "User ID or Email is required.",
      });
    }

    const sessions = await sessionService.getUserSessions(userId, userEmail);
    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    console.error("Error fetching user sessions:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch user login sessions.",
    });
  }
};

/**
 * GET /api/sessions/all
 * Super Admin views ALL platform user login sessions
 */
exports.getAllSessions = async (req, res) => {
  try {
    const userRole = req.user?.role || "";
    const isSuperOrAdmin = userRole.toLowerCase().includes("admin");

    // Allow fetching if admin/superAdmin or if explicitly requested
    const sessions = await sessionService.getAllSessions();
    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    console.error("Error fetching all sessions:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch all login sessions.",
    });
  }
};

/**
 * DELETE /api/sessions/:sessionId
 * Terminate a login session
 */
exports.terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await sessionService.terminateSession(sessionId, req.user || {});
    return res.status(result.statusCode || 200).json(result);
  } catch (err) {
    console.error("Error terminating session:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to terminate session.",
    });
  }
};
