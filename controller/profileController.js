const profileService = require("../services/profileService");

/**
 * GET /profile/me
 * Returns the profile of the authenticated user.
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await profileService.getProfile(userId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
};

/**
 * PUT /profile/me
 * Creates or updates the profile of the authenticated user.
 */
exports.saveProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      headline,
      company,
      location,
      experience,
      ctc,
      phone,
      noticePeriod,
      avatarUrl,
      skills,
      education,
      employment,
      resumeFileName,
      resumeUploadDate,
    } = req.body;

    const profileData = {
      headline,
      company,
      location,
      experience,
      ctc,
      phone,
      noticePeriod,
      avatarUrl,
      skills: Array.isArray(skills) ? skills : [],
      education: Array.isArray(education) ? education : [],
      employment: Array.isArray(employment) ? employment : [],
      resumeFileName,
      resumeUploadDate,
    };

    const result = await profileService.saveProfile(userId, profileData);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
};
