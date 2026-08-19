const candidateRepo = require("../repository/candidateRepo");

const REQUIRED_FIELDS = [
  { key: "currentRole",       label: "Current Role / Job Title" },
  { key: "yearsExperience",   label: "Years of Experience" },
  { key: "preferredLocation", label: "Preferred Location" },
  { key: "skills",            label: "At least 1 Skill" },
  { key: "resumeUrl",         label: "Resume URL" },
];

exports.checkProfileReadiness = async (userId) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  const candidate = await candidateRepo.findCandidateByUserId(userId);

  const checklist = REQUIRED_FIELDS.map((field) => {
    let filled = false;
    if (field.key === "skills") {
      filled = Array.isArray(candidate?.skills) && candidate.skills.length > 0;
    } else {
      const value = candidate?.[field.key];
      filled = value !== null && value !== undefined && value.toString().trim() !== "";
    }
    return { key: field.key, label: field.label, filled };
  });

  const filledCount = checklist.filter((c) => c.filled).length;
  const totalCount  = checklist.length;
  const isReady     = filledCount === totalCount;
  const percentage  = Math.round((filledCount / totalCount) * 100);
  const missing     = checklist.filter((c) => !c.filled).map((c) => c.label);

  return {
    success: true,
    statusCode: 200,
    message: isReady
      ? "Profile is complete. You are eligible to take interviews!"
      : `Profile incomplete. ${missing.length} required field(s) missing.`,
    data: {
      isReady,
      percentage,
      filledCount,
      totalCount,
      checklist,
      missing,
    },
  };
};

exports.getCandidateProfile = async (userId) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  let candidate = await candidateRepo.findCandidateByUserId(userId);

  if (!candidate) {
    candidate = await candidateRepo.createCandidate({
      userId,
      applicationStatus: "active",
    });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Candidate profile fetched successfully",
    data: candidate,
  };
};

exports.updateCandidateProfile = async (userId, updateData) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  let candidate = await candidateRepo.findCandidateByUserId(userId);
  if (!candidate) {
    candidate = await candidateRepo.createCandidate({
      userId,
      ...updateData,
      applicationStatus: updateData.applicationStatus || "active",
    });
    return {
      success: true,
      statusCode: 201,
      message: "Candidate profile created successfully",
      data: candidate,
    };
  }

  const updated = await candidateRepo.updateCandidate(userId, updateData);

  return {
    success: true,
    statusCode: 200,
    message: "Candidate profile updated successfully",
    data: updated,
  };
};

exports.getCandidateById = async (candidateId) => {
  if (!candidateId) {
    return { success: false, statusCode: 400, message: "Candidate ID is required." };
  }

  const candidate = await candidateRepo.findCandidateById(candidateId);
  if (!candidate) {
    return { success: false, statusCode: 404, message: "Candidate not found." };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Candidate fetched successfully",
    data: candidate,
  };
};

exports.getAllCandidates = async () => {
  const candidates = await candidateRepo.getAllCandidates();
  return {
    success: true,
    statusCode: 200,
    message: "All candidates fetched successfully",
    data: candidates,
  };
};

exports.deleteCandidate = async (userId) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  const deleted = await candidateRepo.deleteCandidate(userId);
  if (!deleted) {
    return { success: false, statusCode: 404, message: "Candidate not found." };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Candidate profile deleted successfully",
  };
};
