const superAdminService = require("../services/superAdminService");

/**
 * GET /super-admin/
 * Returns all super admins (root only).
 */
exports.getAllSuperAdmins = async (req, res) => {
  try {
    const result = await superAdminService.getAllSuperAdmins();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * GET /super-admin/me
 * Returns the super admin profile of the authenticated user.
 */
exports.getSuperAdminMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await superAdminService.getSuperAdminByUserId(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * GET /super-admin/:id
 * Returns a super admin by their superadminId.
 */
exports.getSuperAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.getSuperAdminById(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * POST /super-admin/create
 * Creates a new super admin record for a user.
 */
exports.createSuperAdmin = async (req, res) => {
  try {
    const createdById = req.user?.userId;
    const { userId, level, permissions } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const result = await superAdminService.createSuperAdmin({
      userId,
      level,
      permissions,
      createdById,
    });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * PUT /super-admin/:id
 * Updates a super admin's level or permissions.
 */
exports.updateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, permissions, twoFactorEnabled, ipWhitelist } = req.body;

    const result = await superAdminService.updateSuperAdmin(id, {
      level,
      permissions,
      twoFactorEnabled,
      ipWhitelist,
    });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * DELETE /super-admin/:id
 * Soft-deletes a super admin record.
 */
exports.deleteSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.deleteSuperAdmin(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * GET /super-admin/companies
 */
exports.getAllCompanies = async (req, res) => {
  try {
    const result = await superAdminService.getAllCompanies();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * PUT /super-admin/companies/:id/approve
 */
exports.approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.approveCompany(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * PUT /super-admin/companies/:id/reject
 */
exports.rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.rejectCompany(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * DELETE /super-admin/companies/:id/soft
 */
exports.softDeleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.softDeleteCompany(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * DELETE /super-admin/companies/:id/hard
 */
exports.hardDeleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.hardDeleteCompany(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * GET /super-admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const result = await superAdminService.getAllUsers();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * PUT /super-admin/users/:id/restore
 */
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.restoreUser(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * DELETE /super-admin/users/:id/soft
 */
exports.softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.softDeleteUser(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

/**
 * DELETE /super-admin/users/:id/hard
 */
exports.hardDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await superAdminService.hardDeleteUser(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};


