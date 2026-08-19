const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const candidateController = require("../controller/candidateController");

// Candidate's own profile
router.get("/me/profile-status", auth, candidateController.getProfileStatus);
router.get("/me",     auth, candidateController.getMyProfile);
router.put("/me",     auth, candidateController.updateMyProfile);
router.delete("/me",  auth, candidateController.deleteMyProfile);

// Get a specific candidate by candidateId (company / admin can view)
router.get("/:id",   auth, candidateController.getCandidateById);

// Get all candidates (admin use)
router.get("/",      auth, candidateController.getAllCandidates);

module.exports = router;
