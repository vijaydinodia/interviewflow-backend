const interviewerRepo = require("../repository/interviewerRepo");

exports.getInterviewerProfile = async (userId) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  let interviewer = await interviewerRepo.findInterviewerByUserId(userId);

  if (!interviewer) {
    interviewer = await interviewerRepo.createInterviewer({ userId });
  }

  return {
    success: true,
    statusCode: 200,
    message: "Interviewer profile fetched successfully",
    data: interviewer,
  };
};

exports.updateInterviewerProfile = async (userId, updateData) => {
  if (!userId) {
    return { success: false, statusCode: 400, message: "User ID is required." };
  }

  let interviewer = await interviewerRepo.findInterviewerByUserId(userId);

  if (!interviewer) {
    interviewer = await interviewerRepo.createInterviewer({ userId, ...updateData });
    return {
      success: true,
      statusCode: 201,
      message: "Interviewer profile created successfully",
      data: interviewer,
    };
  }

  const updated = await interviewerRepo.updateInterviewer(userId, updateData);

  return {
    success: true,
    statusCode: 200,
    message: "Interviewer profile updated successfully",
    data: updated,
  };
};

exports.getAllInterviewers = async () => {
  const interviewers = await interviewerRepo.getAllInterviewers();
  return {
    success: true,
    statusCode: 200,
    message: "All interviewers fetched successfully",
    data: interviewers,
  };
};
