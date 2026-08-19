const companyService = require("../services/companyService");

// GET /company/me — Get logged-in company's profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const result = await companyService.getCompanyProfile(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// PUT /company/me — Update logged-in company's profile
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const {
      companyName,
      tagline,
      website,
      industry,
      companySize,
      location,
      contactPhone,
      contactEmail,
      logoUrl,
      verificationDoc,
    } = req.body || {};

    const updateData = {
      companyName,
      tagline,
      website,
      industry,
      companySize,
      location,
      contactPhone,
      contactEmail,
      logoUrl,
      verificationDoc,
    };

    // Remove undefined fields so we don't overwrite saved data with null
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await companyService.updateCompanyProfile(userId, updateData);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};

// GET /company — Get all companies (super admin use)
exports.getAllCompanies = async (req, res) => {
  try {
    const result = await companyService.getAllCompanies();
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "An unexpected error occurred." });
  }
};
