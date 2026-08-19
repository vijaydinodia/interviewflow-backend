const profileRepo = require("../repository/profileRepo");

exports.getProfile = async (userId) => {
  const profile = await profileRepo.getProfileByUserId(userId);
  if (!profile) {
    return {
      success: true,
      statusCode: 200,
      message: "No profile found",
      data: null,
    };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Profile fetched successfully",
    data: profile,
  };
};

exports.saveProfile = async (userId, profileData) => {
  if (!userId) {
    return {
      success: false,
      statusCode: 400,
      message: "User ID is required.",
    };
  }

  const profile = await profileRepo.upsertProfile(userId, profileData);
  return {
    success: true,
    statusCode: 200,
    message: "Profile saved successfully",
    data: profile,
  };
};
