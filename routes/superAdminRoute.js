const express = require("express");
const router = express.Router();
const { auth, authorizeRoles } = require("../middleware/auth");
const {
  getAllSuperAdmins,
  getSuperAdminMe,
  getSuperAdminById,
  createSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
  getAllCompanies,
  approveCompany,
  rejectCompany,
  softDeleteCompany,
  hardDeleteCompany,
  approveInterviewer,
  rejectInterviewer,
  getAllUsers,
  restoreUser,
  softDeleteUser,
  hardDeleteUser,
} = require("../controller/superAdminController");

// Protect all superadmin routes with auth and superadmin role check
const superAdminAuth = [auth, authorizeRoles("superadmin")];

// Super-admin routes for system governance
router.get("/", superAdminAuth, getAllSuperAdmins);
router.get("/me", superAdminAuth, getSuperAdminMe);
router.get("/companies", superAdminAuth, getAllCompanies);
router.put("/companies/:id/approve", superAdminAuth, approveCompany);
router.put("/companies/:id/reject", superAdminAuth, rejectCompany);
router.delete("/companies/:id/soft", superAdminAuth, softDeleteCompany);
router.delete("/companies/:id/hard", superAdminAuth, hardDeleteCompany);

router.put("/interviewers/:id/approve", superAdminAuth, approveInterviewer);
router.put("/interviewers/:id/reject", superAdminAuth, rejectInterviewer);

router.get("/users", superAdminAuth, getAllUsers);
router.put("/users/:id/restore", superAdminAuth, restoreUser);
router.delete("/users/:id/soft", superAdminAuth, softDeleteUser);
router.delete("/users/:id/hard", superAdminAuth, hardDeleteUser);

router.get("/:id", superAdminAuth, getSuperAdminById);

router.post("/create", superAdminAuth, createSuperAdmin);
router.put("/:id", superAdminAuth, updateSuperAdmin);
router.delete("/:id", superAdminAuth, deleteSuperAdmin);

module.exports = router;
