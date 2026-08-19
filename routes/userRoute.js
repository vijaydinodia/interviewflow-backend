const express = require("express");
const router = express.Router();

const {
  createUser,
  login,
  forgotPassword,
  resetPassword,
  sendTestEmail,
  sendInterviewInviteEmail,
} = require("../controller/userController");

router.post("/create-user", createUser);
router.post("/create", createUser);
router.post("/register", createUser);
router.post("/signup", createUser);

router.post("/login", login);
router.post("/signin", login);

router.post("/forgot-password", forgotPassword);
router.post("/forget-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/send-test-email", sendTestEmail);
router.post("/send-interview-invite", sendInterviewInviteEmail);

module.exports = router;