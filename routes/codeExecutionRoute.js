const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const codeExecutionController = require("../controller/codeExecutionController");

// ── PUBLIC ROUTE (guests and logged-in users both supported) ──
// POST /code/execute — run code via Judge0, saves history if user is authenticated
router.post("/execute", (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return auth(req, res, () => codeExecutionController.executeCode(req, res));
  }
  return codeExecutionController.executeCode(req, res);
});

// ── AUTH-REQUIRED ROUTES ──

// GET /code/history/me — logged-in user's execution history
router.get("/history/me", auth, codeExecutionController.getMyHistory);

// GET /code/history/room/:roomCode — all executions in an interview room
router.get("/history/room/:roomCode", auth, codeExecutionController.getRoomHistory);

// GET /code/history/:executionId — single execution record by ID
router.get("/history/:executionId", auth, codeExecutionController.getExecutionById);

// DELETE /code/history/:executionId — delete a specific execution record
router.delete("/history/:executionId", auth, codeExecutionController.deleteExecution);

// ── SUPER ADMIN ROUTE ──
// GET /code/admin/all — all executions for analytics
router.get("/admin/all", auth, codeExecutionController.getAllExecutions);

module.exports = router;
