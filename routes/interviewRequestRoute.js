const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const interviewRequestService = require("../services/interviewRequestService");

// GET /interview-requests/matching-interviewers — Candidates get interviewers matching their requirements
router.get("/matching-interviewers", auth, async (req, res) => {
  try {
    const { role, language, skills, search } = req.query;
    const filters = {
      role,
      language,
      skills: skills ? (Array.isArray(skills) ? skills : skills.split(",")) : undefined,
      search,
    };

    const result = await interviewRequestService.getMatchingInterviewers(filters);
    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// POST /interview-requests — Candidate submits interview request for an interviewer
router.post("/", auth, async (req, res) => {
  try {
    const candidateUserId = req.user?.userId;
    if (!candidateUserId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const {
      interviewerUserId,
      requestType,
      roleRequirement,
      language,
      topicFocus,
      scheduledDate,
      scheduledTime,
      roomCode,
      candidateNotes,
    } = req.body;

    const result = await interviewRequestService.createInterviewRequest({
      candidateUserId,
      interviewerUserId,
      requestType: requestType || (interviewerUserId ? "direct" : "open"),
      roleRequirement,
      language,
      topicFocus,
      scheduledDate,
      scheduledTime,
      roomCode: roomCode || `INT-${Math.floor(1000 + Math.random() * 9000)}-FLOW`,
      candidateNotes,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// GET /interview-requests/my-requests — Candidate gets their submitted requests
router.get("/my-requests", auth, async (req, res) => {
  try {
    const candidateUserId = req.user?.userId;
    if (!candidateUserId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const result = await interviewRequestService.getCandidateRequests(candidateUserId);
    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// GET /interview-requests/interviewer-requests — Interviewer gets incoming requests
router.get("/interviewer-requests", auth, async (req, res) => {
  try {
    const interviewerUserId = req.user?.userId;
    if (!interviewerUserId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const result = await interviewRequestService.getInterviewerRequests(interviewerUserId);
    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// PUT /interview-requests/:requestId/status — Interviewer takes action (accept, reject, complete)
router.put("/:requestId/status", auth, async (req, res) => {
  try {
    const interviewerUserId = req.user?.userId;
    if (!interviewerUserId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const { requestId } = req.params;
    const { status, note } = req.body;

    const result = await interviewRequestService.updateRequestStatus({
      requestId,
      interviewerUserId,
      status,
      note,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// PUT /interview-requests/:requestId/reroute — Candidate re-routes declined/dropped request to Open Pool
router.put("/:requestId/reroute", auth, async (req, res) => {
  try {
    const candidateUserId = req.user?.userId;
    if (!candidateUserId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const { requestId } = req.params;
    const result = await interviewRequestService.rerouteRequestToOpenPool({
      requestId,
      candidateUserId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// PUT /interview-requests/:requestId/reassign — Candidate reassigns declined request to another specific interviewer
router.put("/:requestId/reassign", auth, async (req, res) => {
  try {
    const candidateUserId = req.user?.userId;
    if (!candidateUserId) return res.status(401).json({ success: false, message: "Unauthorized." });

    const { requestId } = req.params;
    const { newInterviewerUserId } = req.body;

    if (!newInterviewerUserId) {
      return res.status(400).json({ success: false, message: "New interviewer ID is required." });
    }

    const result = await interviewRequestService.reassignRequestToInterviewer({
      requestId,
      candidateUserId,
      newInterviewerUserId,
    });

    return res.status(result.statusCode).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
