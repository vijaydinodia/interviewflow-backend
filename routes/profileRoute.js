const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { getProfile, saveProfile } = require("../controller/profileController");

// All profile routes require a valid JWT
router.get("/me", auth, getProfile);
router.put("/me", auth, saveProfile);

module.exports = router;
