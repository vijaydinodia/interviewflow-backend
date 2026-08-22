const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const sessionController = require("../controller/sessionController");

// Optional auth helper
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return auth(req, res, next);
  }
  return next();
};

// GET /sessions/my-sessions — User sees only self login sessions
router.get("/my-sessions", optionalAuth, sessionController.getMySessions);

// GET /sessions/all — Super Admin sees all user login sessions
router.get("/all", optionalAuth, sessionController.getAllSessions);

// DELETE /sessions/:sessionId — Terminate session
router.delete("/:sessionId", optionalAuth, sessionController.terminateSession);

module.exports = router;
