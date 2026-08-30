const { questionModel } = require("../models");
const { Op } = require("sequelize");

// Create a single question
exports.createQuestion = async (data) => {
  try {
    return await questionModel.create(data);
  } catch (err) {
    // Auto-sync table if it doesn't exist yet
    if (err.message && (err.message.includes("doesn't exist") || err.message.includes("foreign key constraint"))) {
      await questionModel.sync();
      return await questionModel.create(data);
    }
    throw err;
  }
};

// Bulk create questions (skip duplicates by titleSlug)
exports.bulkCreateQuestions = async (dataArray) => {
  try {
    return await questionModel.bulkCreate(dataArray, {
      ignoreDuplicates: true,
    });
  } catch (err) {
    if (err.message && err.message.includes("doesn't exist")) {
      await questionModel.sync();
      return await questionModel.bulkCreate(dataArray, {
        ignoreDuplicates: true,
      });
    }
    throw err;
  }
};

// Get all questions with optional filters
exports.getAllQuestions = async (filters = {}) => {
  try {
    const where = {};

    // Filter by difficulty
    if (filters.difficulty && filters.difficulty !== "all") {
      where.difficulty = filters.difficulty;
    }

    // Search by title or frontendId
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchTerm } },
        { frontendId: { [Op.like]: searchTerm } },
      ];
    }

    const queryOptions = {
      where,
      order: [[questionModel.sequelize.literal("CAST(frontend_id AS UNSIGNED)"), "ASC"]],
    };

    return await questionModel.findAll(queryOptions);
  } catch (err) {
    if (err.message && err.message.includes("doesn't exist")) {
      await questionModel.sync();
      return [];
    }
    throw err;
  }
};

// Get a single question by its primary key
exports.getQuestionById = async (questionId) => {
  return await questionModel.findByPk(questionId);
};

// Update a question
exports.updateQuestion = async (questionId, data) => {
  const question = await questionModel.findByPk(questionId);
  if (!question) return null;
  await question.update(data);
  return question;
};

// Delete a question
exports.deleteQuestion = async (questionId) => {
  return await questionModel.destroy({ where: { questionId } });
};

// Get total question count
exports.getQuestionCount = async () => {
  try {
    return await questionModel.count();
  } catch (err) {
    if (err.message && err.message.includes("doesn't exist")) {
      await questionModel.sync();
      return 0;
    }
    throw err;
  }
};

// Get the next frontend ID based on the highest existing numeric frontendId
exports.getNextFrontendId = async () => {
  try {
    const { sequelize } = require("../models");
    // Query max numeric value from frontend_id
    const [result] = await sequelize.query(
      "SELECT MAX(CAST(frontend_id AS UNSIGNED)) AS maxId FROM questions WHERE frontend_id REGEXP '^[0-9]+$';"
    );
    const maxId = result && result[0] && result[0].maxId ? parseInt(result[0].maxId, 10) : 0;
    if (maxId > 0) {
      return (maxId + 1).toString();
    }
    const count = await questionModel.count();
    return (count + 1).toString();
  } catch (err) {
    const count = await questionModel.count().catch(() => 0);
    return (count + 1).toString();
  }
};
