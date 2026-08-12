const express = require("express");
const router = express.Router();

const {
  createUser,
  login,
  forgotPassword,
  resetPassword,
} = require("../controller/userController");

router.post("/create-user", createUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/forget-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;