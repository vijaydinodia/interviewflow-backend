const questionService = require("../services/questionService");
const path = require("path");
const fs = require("fs");

// POST /questions — Add a single question
exports.addQuestion = async (req, res) => {
  try {
    const {
      frontendId, title, titleSlug, difficulty, description,
      topicTags, hints, examples, constraints, codeSnippets,
    } = req.body;

    const uploadedBy = req.user?.userId || null;

    const question = await questionService.addQuestion({
      frontendId,
      title,
      titleSlug,
      difficulty,
      description,
      topicTags: topicTags || [],
      hints: hints || [],
      examples: examples || [],
      constraints: constraints || "",
      codeSnippets: codeSnippets || [],
      uploadedBy,
    });

    return res.status(201).json({
      success: true,
      message: "Question added successfully!",
      data: question,
    });
  } catch (error) {
    console.error("Error in addQuestion:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add question.",
    });
  }
};

// POST /questions/bulk — Bulk upload questions from JSON array
exports.bulkUploadQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const uploadedBy = req.user?.userId || null;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a 'questions' array in the request body.",
      });
    }

    // Attach uploadedBy to each question
    const withUploader = questions.map((q) => ({
      ...q,
      uploadedBy: q.uploadedBy || uploadedBy,
    }));

    const result = await questionService.bulkAddQuestions(withUploader);

    return res.status(201).json({
      success: true,
      message: `${result.length} questions uploaded successfully!`,
      count: result.length,
    });
  } catch (error) {
    console.error("Error in bulkUploadQuestions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to bulk upload questions.",
    });
  }
};

// GET /questions — Get all questions (with optional filters)
exports.getAllQuestions = async (req, res) => {
  try {
    const { difficulty, search, tag } = req.query;
    let questions = await questionService.getAllQuestions({ difficulty, search });

    // Filter by tag in application layer (JSON column)
    if (tag && tag !== "all") {
      questions = questions.filter((q) => {
        const tags = q.topicTags || [];
        return tags.some(
          (t) =>
            t.slug?.toLowerCase() === tag.toLowerCase() ||
            t.name?.toLowerCase() === tag.toLowerCase()
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error("Error in getAllQuestions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions.",
    });
  }
};

// GET /questions/count — Get total question count
exports.getQuestionCount = async (req, res) => {
  try {
    const count = await questionService.getCount();
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error in getQuestionCount:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get question count.",
    });
  }
};

// GET /questions/next-id — Get the next auto-incremented frontendId
exports.getNextFrontendId = async (req, res) => {
  try {
    const nextId = await questionService.getNextId();
    return res.status(200).json({ success: true, nextId });
  } catch (error) {
    console.error("Error in getNextFrontendId:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to determine next question ID.",
    });
  }
};

// GET /questions/:id — Get a single question
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    console.error("Error in getQuestionById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch question.",
    });
  }
};

// PUT /questions/:id — Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await questionService.updateQuestion(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Question updated successfully!",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateQuestion:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update question.",
    });
  }
};

// DELETE /questions/:id — Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await questionService.deleteQuestion(id);
    return res.status(200).json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete question.",
    });
  }
};

// POST /questions/seed — Seed questions from the existing JSON file
exports.seedFromJson = async (req, res) => {
  try {
    const uploadedBy = req.user?.userId || null;

    // Try to find the JSON file
    const possiblePaths = [
      path.join(__dirname, "../data/leetcode_questions_1000.json"),
      path.join(process.cwd(), "data/leetcode_questions_1000.json"),
    ];

    let jsonData = null;
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          jsonData = JSON.parse(raw);
          break;
        }
      } catch (readErr) {
        console.error(`Error reading ${filePath}:`, readErr.message);
      }
    }

    if (!jsonData || !Array.isArray(jsonData)) {
      return res.status(404).json({
        success: false,
        message: "Seed JSON file not found or invalid.",
      });
    }

    // Map JSON data to model fields and attach uploader
    const mapped = jsonData.map((q) => ({
      frontendId: q.frontendId || q.questionId || null,
      title: q.title,
      titleSlug: q.titleSlug,
      difficulty: q.difficulty,
      description: q.description || "",
      topicTags: q.topicTags || [],
      hints: q.hints || [],
      examples: q.examples || [],
      constraints: q.constraints || "",
      codeSnippets: q.codeSnippets || [],
      uploadedBy,
    }));

    const result = await questionService.bulkAddQuestions(mapped);

    return res.status(201).json({
      success: true,
      message: `Seeded ${result.length} questions from JSON file!`,
      count: result.length,
    });
  } catch (error) {
    console.error("Error in seedFromJson:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to seed questions.",
    });
  }
};
