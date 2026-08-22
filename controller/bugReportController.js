const bugReportService = require("../services/bugReportService");
const { sendBugReportConfirmationEmail } = require("../services/emailService");

exports.submitBugReport = async (req, res) => {
  try {
    const { title, description, category, severity, photoUrl, pageUrl, userName, userEmail, userRole } = req.body;
    const userId = req.user?.userId || req.body.userId || null;

    const report = await bugReportService.submitBugReport({
      userId,
      userName: userName || req.user?.fullName || req.user?.email || "Anonymous",
      userEmail: userEmail || req.user?.email || "",
      userRole: userRole || req.user?.role || "candidate",
      title,
      description,
      category: category || "General UI",
      severity: severity || "medium",
      photoUrl: photoUrl || null,
      pageUrl: pageUrl || "",
      status: "open",
    });

    // Send confirmation email to the reporter (fire-and-forget, don't block response)
    const reporterEmail = userEmail || req.user?.email;
    if (reporterEmail) {
      sendBugReportConfirmationEmail({
        to: reporterEmail,
        reporterName: userName || req.user?.fullName || "User",
        bugTitle: title,
        bugCategory: category || "General UI",
        bugSeverity: severity || "medium",
        bugId: report.bugId || report.bug_id,
      }).catch((err) => console.error("Bug confirmation email error:", err.message));
    }

    return res.status(201).json({
      success: true,
      message: "Bug report submitted successfully! Thank you for reporting.",
      data: report,
    });
  } catch (error) {
    console.error("Error in submitBugReport:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit bug report.",
    });
  }
};

exports.getAllBugReports = async (req, res) => {
  try {
    const reports = await bugReportService.getAllBugReports();
    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Error in getAllBugReports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bug reports.",
    });
  }
};

exports.getUserBugReports = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.userId;
    const userEmail = req.user?.email || req.query.userEmail;
    
    const reports = await bugReportService.getUserBugReports(userId, userEmail);
    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Error in getUserBugReports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user bug reports.",
    });
  }
};

exports.updateBugStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await bugReportService.updateBugStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Bug report not found." });
    }
    return res.status(200).json({
      success: true,
      message: `Bug status updated to '${status}'.`,
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateBugStatus:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update bug status.",
    });
  }
};

exports.deleteBugReport = async (req, res) => {
  try {
    const { id } = req.params;
    await bugReportService.deleteBugReport(id);
    return res.status(200).json({
      success: true,
      message: "Bug report deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteBugReport:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete bug report.",
    });
  }
};
