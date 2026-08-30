const questionRepo = require("../repository/questionRepo");

// Add a single question with validation
exports.addQuestion = async (questionData) => {
  if (!questionData.title || !questionData.title.trim()) {
    throw new Error("Question title is required.");
  }
  if (!questionData.difficulty) {
    throw new Error("Question difficulty is required.");
  }
  if (!questionData.description || !questionData.description.trim()) {
    throw new Error("Question description is required.");
  }

  // Auto-pick next frontendId from last question if not provided
  if (!questionData.frontendId || !questionData.frontendId.toString().trim()) {
    questionData.frontendId = await questionRepo.getNextFrontendId();
  }

  // Auto-generate titleSlug from title if not provided
  if (!questionData.titleSlug) {
    questionData.titleSlug = questionData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return await questionRepo.createQuestion(questionData);
};

// Bulk add questions
exports.bulkAddQuestions = async (questionsArray) => {
  if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
    throw new Error("Please provide an array of questions.");
  }

  // Auto-generate titleSlug for each question if missing
  const processed = questionsArray.map((q) => {
    if (!q.titleSlug && q.title) {
      q.titleSlug = q.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    return q;
  });

  return await questionRepo.bulkCreateQuestions(processed);
};

// Get all questions with optional filters
exports.getAllQuestions = async (filters) => {
  return await questionRepo.getAllQuestions(filters);
};

// Get a single question by ID
exports.getQuestionById = async (questionId) => {
  return await questionRepo.getQuestionById(questionId);
};

// Update a question
exports.updateQuestion = async (questionId, data) => {
  return await questionRepo.updateQuestion(questionId, data);
};

// Delete a question
exports.deleteQuestion = async (questionId) => {
  return await questionRepo.deleteQuestion(questionId);
};

// Get total count
exports.getCount = async () => {
  return await questionRepo.getQuestionCount();
};

// Get next frontendId
exports.getNextId = async () => {
  return await questionRepo.getNextFrontendId();
};
