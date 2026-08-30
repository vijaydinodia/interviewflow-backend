const express = require("express");
const router = express.Router();
const { auth, authorizeRoles } = require("../middleware/auth");
const questionController = require("../controller/questionController");

// ── Public routes (candidates can read questions) ──

// GET /questions — list all questions (with optional filters: difficulty, search, tag)
router.get("/", questionController.getAllQuestions);

// GET /questions/count — get total question count
router.get("/count", questionController.getQuestionCount);

// GET /questions/next-id — get next calculated question number
router.get("/next-id", questionController.getNextFrontendId);

// GET /questions/:id — get a single question by ID
router.get("/:id", questionController.getQuestionById);

// ── Protected routes (superAdmin and admin only) ──

// POST /questions — add a single question
router.post("/", auth, authorizeRoles("superAdmin", "admin"), questionController.addQuestion);

// POST /questions/bulk — bulk upload questions from JSON array
router.post("/bulk", auth, authorizeRoles("superAdmin", "admin"), questionController.bulkUploadQuestions);

// PUT /questions/:id — update a question
router.put("/:id", auth, authorizeRoles("superAdmin", "admin"), questionController.updateQuestion);

// DELETE /questions/:id — delete a question
router.delete("/:id", auth, authorizeRoles("superAdmin", "admin"), questionController.deleteQuestion);

module.exports = router;
