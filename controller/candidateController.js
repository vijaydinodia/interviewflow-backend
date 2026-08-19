const candidateService = require("../services/candidateService");

// GET /candidate/me/profile-status — Check if profile is complete for interviews
exports.getProfileStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const result = await candidateService.checkProfileReadiness(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// GET /candidate/me  — Get logged-in candidate's profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const result = await candidateService.getCandidateProfile(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// PUT /candidate/me  — Update logged-in candidate's profile
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const {
      currentRole,
      yearsExperience,
      preferredLocation,
      resumeUrl,
      skills,
      applicationStatus,
    } = req.body || {};

    const updateData = {
      currentRole,
      yearsExperience,
      preferredLocation,
      resumeUrl,
      skills,
      applicationStatus,
    };

    // Remove undefined fields so we don't overwrite with null
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await candidateService.updateCandidateProfile(userId, updateData);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// GET /candidate/:id  — Get a candidate by ID (for company / admin use)
exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await candidateService.getCandidateById(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// GET /candidate  — Get all candidates (admin / super admin use)
exports.getAllCandidates = async (req, res) => {
  try {
    const result = await candidateService.getAllCandidates();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// DELETE /candidate/me  — Delete logged-in candidate's profile
exports.deleteMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const result = await candidateService.deleteCandidate(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};
