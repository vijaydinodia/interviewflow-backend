const superAdminRepo = require("../repository/superAdminRepo");
const userRepo = require("../repository/userRepo");

exports.getAllSuperAdmins = async () => {
  const superAdmins = await superAdminRepo.getAllSuperAdmins();
  return {
    success: true,
    statusCode: 200,
    message: "Super admins fetched successfully",
    data: superAdmins,
  };
};

exports.getSuperAdminByUserId = async (userId) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  const superAdmin = await superAdminRepo.getSuperAdminByUserId(userId);
  if (!superAdmin) {
    return { success: false, statusCode: 404, message: "Super admin not found." };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Super admin fetched successfully",
    data: superAdmin,
  };
};

exports.getSuperAdminById = async (superadminId) => {
  if (!superadminId) {
    return { success: false, statusCode: 400, message: "Super admin ID is required." };
  }

  const superAdmin = await superAdminRepo.getSuperAdminById(superadminId);
  if (!superAdmin) {
    return { success: false, statusCode: 404, message: "Super admin not found." };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Super admin fetched successfully",
    data: superAdmin,
  };
};

exports.createSuperAdmin = async (data) => {
  const { userId, level, permissions, createdById } = data;

  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  const existing = await superAdminRepo.getSuperAdminByUserId(userId);
  if (existing) {
    return { success: false, statusCode: 409, message: "A super admin record already exists for this user." };
  }

  const superAdmin = await superAdminRepo.createSuperAdmin({
    userId,
    level: level || "operations",
    permissions: permissions || {
      manageCompanies: true,
      manageUsers: true,
      manageBilling: true,
      viewAuditLogs: true,
      systemConfig: false,
      manageSuperadmins: false,
    },
    createdById: createdById || null,
  });

  return {
    success: true,
    statusCode: 201,
    message: "Super admin created successfully",
    data: superAdmin,
  };
};

exports.updateSuperAdmin = async (superadminId, updateData) => {
  if (!superadminId) {
    return { success: false, statusCode: 400, message: "Super admin ID is required." };
  }

  const updated = await superAdminRepo.updateSuperAdmin(superadminId, updateData);
  if (!updated) {
    return { success: false, statusCode: 404, message: "Super admin not found." };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Super admin updated successfully",
    data: updated,
  };
};

exports.deleteSuperAdmin = async (superadminId) => {
  if (!superadminId) {
    return { success: false, statusCode: 400, message: "Super admin ID is required." };
  }

  const deleted = await superAdminRepo.deleteSuperAdmin(superadminId);
  if (!deleted) {
    return { success: false, statusCode: 404, message: "Super admin not found." };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Super admin deleted successfully",
  };
};

exports.getAllCompanies = async () => {
  const companies = await userRepo.getAllCompanies();
  return {
    success: true,
    statusCode: 200,
    message: "Companies fetched successfully",
    data: companies,
  };
};

exports.approveCompany = async (userId) => {
  const updated = await userRepo.updateUser(userId, { isActive: true });
  if (!updated) {
    return { success: false, statusCode: 404, message: "Company user not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Company account approved successfully",
    data: updated,
  };
};

exports.rejectCompany = async (userId) => {
  const updated = await userRepo.updateUser(userId, { isActive: false });
  if (!updated) {
    return { success: false, statusCode: 404, message: "Company user not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Company account rejected successfully",
    data: updated,
  };
};

exports.approveInterviewer = async (userId) => {
  const db = require("../models/index");
  const interviewer = await db.interviewerModel.findOne({ where: { userId } });
  if (interviewer) {
    await interviewer.update({ isVerified: true });
  }
  const updatedUser = await userRepo.updateUser(userId, { isActive: true });
  if (!updatedUser && !interviewer) {
    return { success: false, statusCode: 404, message: "Interviewer user not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Interviewer account verified & approved successfully",
    data: { user: updatedUser, interviewer },
  };
};

exports.rejectInterviewer = async (userId) => {
  const db = require("../models/index");
  const interviewer = await db.interviewerModel.findOne({ where: { userId } });
  if (interviewer) {
    await interviewer.update({ isVerified: false });
  }
  const updatedUser = await userRepo.updateUser(userId, { isActive: false });
  if (!updatedUser && !interviewer) {
    return { success: false, statusCode: 404, message: "Interviewer user not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Interviewer account marked pending / rejected",
    data: { user: updatedUser, interviewer },
  };
};

exports.softDeleteCompany = async (userId) => {
  const deleted = await userRepo.softDeleteUser(userId);
  if (!deleted) {
    return { success: false, statusCode: 404, message: "Company user not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Company account soft deleted (deactivated) successfully",
    data: deleted,
  };
};

exports.hardDeleteCompany = async (userId) => {
  const deleted = await userRepo.hardDeleteUser(userId);
  if (!deleted) {
    return { success: false, statusCode: 404, message: "Company user not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Company account permanently deleted",
  };
};

exports.getAllUsers = async (query = {}) => {
  const result = await userRepo.getAllUsers(query);
  const isPaginated = !!result.totalPages;
  return {
    success: true,
    statusCode: 200,
    message: "Users fetched successfully",
    data: isPaginated ? result.users : (Array.isArray(result) ? result : result.users || []),
    pagination: isPaginated ? {
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      limit: result.limit,
    } : undefined,
  };
};

exports.restoreUser = async (userId) => {
  const restored = await userRepo.restoreUser(userId);
  if (!restored) {
    return { success: false, statusCode: 404, message: "User not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "User account restored (activated) successfully",
    data: restored,
  };
};

exports.softDeleteUser = async (userId) => {
  const deleted = await userRepo.softDeleteUser(userId);
  if (!deleted) {
    return { success: false, statusCode: 404, message: "User not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "User account soft deleted (deactivated) successfully",
    data: deleted,
  };
};

exports.hardDeleteUser = async (userId) => {
  const deleted = await userRepo.hardDeleteUser(userId);
  if (!deleted) {
    return { success: false, statusCode: 404, message: "User not found." };
  }
  return {
    success: true,
    statusCode: 200,
    message: "User account permanently deleted from database",
  };
};


