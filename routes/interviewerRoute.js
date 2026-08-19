const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const interviewerService = require("../services/interviewerService");

// GET /interviewer/me — Get logged-in interviewer's profile
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const result = await interviewerService.getInterviewerProfile(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
});

// PUT /interviewer/me — Update logged-in interviewer's profile
router.put("/me", auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const { title, department, specialization, availability } = req.body || {};

    const updateData = {};
    if (title !== undefined)         updateData.title = title;
    if (department !== undefined)    updateData.department = department;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (availability !== undefined)  updateData.availability = availability;

    const result = await interviewerService.updateInterviewerProfile(userId, updateData);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
});

// GET /interviewer — Get all interviewers (admin use)
router.get("/", auth, async (req, res) => {
  try {
    const result = await interviewerService.getAllInterviewers();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
});

module.exports = router;
