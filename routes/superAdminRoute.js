const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
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
  getAllUsers,
  restoreUser,
  softDeleteUser,
  hardDeleteUser,
} = require("../controller/superAdminController");

// Super-admin routes for system governance
router.get("/", auth, getAllSuperAdmins);
router.get("/me", auth, getSuperAdminMe);
router.get("/companies", auth, getAllCompanies);
router.put("/companies/:id/approve", auth, approveCompany);
router.put("/companies/:id/reject", auth, rejectCompany);
router.delete("/companies/:id/soft", auth, softDeleteCompany);
router.delete("/companies/:id/hard", auth, hardDeleteCompany);

router.get("/users", auth, getAllUsers);
router.put("/users/:id/restore", auth, restoreUser);
router.delete("/users/:id/soft", auth, softDeleteUser);
router.delete("/users/:id/hard", auth, hardDeleteUser);

router.get("/:id", auth, getSuperAdminById);

router.post("/create", auth, createSuperAdmin);
router.put("/:id", auth, updateSuperAdmin);
router.delete("/:id", auth, deleteSuperAdmin);

module.exports = router;

