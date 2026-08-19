const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const companyController = require("../controller/companyController");

// Company's own profile
router.get("/me",  auth, companyController.getMyProfile);
router.put("/me",  auth, companyController.updateMyProfile);

// All companies list (admin use)
router.get("/",    auth, companyController.getAllCompanies);

module.exports = router;
