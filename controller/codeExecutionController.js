const codeExecutionService = require("../services/codeExecutionService");

/**
 * POST /code/execute
 * Submits source code to Judge0 and returns execution output.
 * Works for both authenticated users (saves history) and guests.
 */
exports.executeCode = async (req, res) => {
  try {
    const { sourceCode, language, stdin, roomCode } = req.body;
    const userId = req.user?.userId || null;

    if (!sourceCode || typeof sourceCode !== "string" || !sourceCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "sourceCode is required and cannot be empty.",
      });
    }

    if (!language || typeof language !== "string") {
      return res.status(400).json({
        success: false,
        message: "language is required (e.g. javascript, python, cpp, java, go, rust).",
      });
    }

    const result = await codeExecutionService.executeCode({
      userId,
      sourceCode,
      language,
      stdin:    stdin || "",
      roomCode: roomCode || null,
    });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data:    result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

/**
 * GET /code/history/me?page=1&limit=20
 * Returns the authenticated user's code execution history.
 */
exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await codeExecutionService.getMyHistory(userId, { page, limit });
    return res.status(result.statusCode).json({
      success:    result.success,
      message:    result.message,
      data:       result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

/**
 * GET /code/history/room/:roomCode
 * Returns all executions that happened inside a specific interview room.
 */
exports.getRoomHistory = async (req, res) => {
  try {
    const { roomCode } = req.params;
    if (!roomCode) {
      return res.status(400).json({ success: false, message: "roomCode param is required." });
    }

    const result = await codeExecutionService.getRoomHistory(roomCode);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data:    result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

/**
 * GET /code/history/:executionId
 * Returns a single execution record by ID.
 */
exports.getExecutionById = async (req, res) => {
  try {
    const { executionId } = req.params;
    const result = await codeExecutionService.getExecutionById(executionId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data:    result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

/**
 * GET /code/admin/all?page=1&limit=20
 * Super admin: returns all execution records (paginated).
 */
exports.getAllExecutions = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await codeExecutionService.getAllExecutions({ page, limit });
    return res.status(result.statusCode).json({
      success:    result.success,
      message:    result.message,
      data:       result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

/**
 * DELETE /code/history/:executionId
 * Deletes a specific execution record.
 */
exports.deleteExecution = async (req, res) => {
  try {
    const { executionId } = req.params;
    const result = await codeExecutionService.deleteExecution(executionId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};
