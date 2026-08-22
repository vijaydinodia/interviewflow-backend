const db = require("../models/index");

/**
 * Save a code execution record to the database.
 */
exports.createExecution = async (data) => {
  return await db.codeExecutionModel.create(data);
};

/**
 * Get a single execution by its UUID.
 */
exports.getExecutionById = async (executionId) => {
  return await db.codeExecutionModel.findByPk(executionId, {
    include: [
      {
        model: db.userModel,
        as: "user",
        attributes: ["userId", "firstName", "lastName", "username", "email", "role"],
      },
    ],
  });
};

/**
 * Get all executions for a specific user (execution history).
 */
exports.getExecutionsByUserId = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  return await db.codeExecutionModel.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
};

/**
 * Get executions for a specific interview room (by room code).
 */
exports.getExecutionsByRoomCode = async (roomCode) => {
  return await db.codeExecutionModel.findAll({
    where: { roomCode },
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: db.userModel,
        as: "user",
        attributes: ["userId", "firstName", "lastName", "username", "email", "role"],
      },
    ],
  });
};

/**
 * Get all execution records (for super admin analytics).
 */
exports.getAllExecutions = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  return await db.codeExecutionModel.findAndCountAll({
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    include: [
      {
        model: db.userModel,
        as: "user",
        attributes: ["userId", "firstName", "lastName", "username", "email", "role"],
      },
    ],
  });
};

/**
 * Delete a specific execution record by ID.
 */
exports.deleteExecution = async (executionId) => {
  const record = await db.codeExecutionModel.findByPk(executionId);
  if (!record) return null;
  await record.destroy();
  return record;
};
