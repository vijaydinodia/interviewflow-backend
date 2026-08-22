const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const bugReportController = require("../controller/bugReportController");

// Middleware to allow optional auth header for submission
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return auth(req, res, next);
  }
  return next();
};

// POST /bugs/submit — submit a new bug report (auth optional or logged-in)
router.post("/submit", optionalAuth, bugReportController.submitBugReport);

// GET /bugs/my-bugs — get bug reports for current user
router.get("/my-bugs", optionalAuth, bugReportController.getUserBugReports);

// GET /bugs/all — get all bug reports across application (for superadmin/admin)
router.get("/all", optionalAuth, bugReportController.getAllBugReports);

// PATCH /bugs/:id/status — update bug report status ('open', 'in_progress', 'resolved', 'closed')
router.patch("/:id/status", optionalAuth, bugReportController.updateBugStatus);

// DELETE /bugs/:id — delete bug report
router.delete("/:id", optionalAuth, bugReportController.deleteBugReport);

module.exports = router;
