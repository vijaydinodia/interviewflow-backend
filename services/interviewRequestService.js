const db = require("../models/index");
const { sendEmail } = require("./emailService");
const path = require("path");
const fs = require("fs");

exports.getMatchingInterviewers = async (filters = {}) => {
  const { role, language, skills, search } = filters;

  const interviewers = await db.interviewerModel.findAll({
    include: [
      {
        model: db.userModel,
        as: "user",
        attributes: { exclude: ["password"] },
        where: { isActive: true },
      },
      {
        model: db.companyModel,
        as: "company",
        attributes: ["companyName", "logoUrl", "industry", "location"],
      },
    ],
    order: [["isVerified", "DESC"], ["createdAt", "DESC"]],
  });

  const formatted = interviewers.map((inv) => {
    const raw = inv.toJSON();
    const specs = Array.isArray(raw.specialization) ? raw.specialization : [];
    const title = (raw.title || "").toLowerCase();
    const dept = (raw.department || "").toLowerCase();

    let matchScore = 70;

    if (role) {
      const target = role.toLowerCase();
      if (title.includes(target) || dept.includes(target)) {
        matchScore += 20;
      }
    }

    if (language) {
      const lang = language.toLowerCase();
      const hasLang = specs.some((s) => s.toLowerCase().includes(lang));
      if (hasLang) matchScore += 10;
    }

    if (skills && Array.isArray(skills)) {
      const matchedSkills = specs.filter((s) =>
        skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
      );
      matchScore += matchedSkills.length * 5;
    }

    matchScore = Math.min(matchScore, 98);

    return {
      ...raw,
      matchScore,
    };
  });

  let results = formatted;
  if (search && search.trim()) {
    const q = search.toLowerCase();
    results = results.filter(
      (inv) =>
        (inv.user?.firstName && inv.user.firstName.toLowerCase().includes(q)) ||
        (inv.user?.fullName && inv.user.fullName.toLowerCase().includes(q)) ||
        (inv.title && inv.title.toLowerCase().includes(q)) ||
        (inv.department && inv.department.toLowerCase().includes(q)) ||
        (inv.specialization && inv.specialization.some((s) => s.toLowerCase().includes(q)))
    );
  }

  results.sort((a, b) => b.matchScore - a.matchScore);

  return {
    success: true,
    statusCode: 200,
    message: "Interviewers fetched successfully",
    data: results,
  };
};

const {
  allocateMeetingLink,
  releaseMeetingLink,
  seedMeetingLinksIfEmpty,
} = require("./meetingLinkService");

const getGoogleMeetLink = () => {
  try {
    const filePath = path.join(__dirname, "../utils/google_meet_links.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const links = JSON.parse(raw);
      if (Array.isArray(links) && links.length > 0) {
        const randomIndex = Math.floor(Math.random() * links.length);
        return links[randomIndex].link;
      }
    }
  } catch (err) {
    console.error("Error reading google_meet_links.json:", err.message);
  }
  return "https://meet.google.com/aij-pwtx-nwz";
};

let schemaEnsured = false;
async function ensureInterviewRequestsSchema() {
  if (schemaEnsured) return;
  try {
    await seedMeetingLinksIfEmpty();
    const [existingCols] = await db.sequelize.query("SHOW COLUMNS FROM `interview_requests`;");
    const colNames = existingCols.map((c) => c.Field);

    if (!colNames.includes("request_type")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `request_type` VARCHAR(20) DEFAULT 'direct';");
      console.log("Added request_type column to interview_requests.");
    }
    if (!colNames.includes("meeting_link")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `meeting_link` VARCHAR(255) NULL;");
      console.log("Added meeting_link column to interview_requests.");
    }
    if (!colNames.includes("candidate_notes")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `candidate_notes` TEXT NULL;");
      console.log("Added candidate_notes column to interview_requests.");
    }
    if (!colNames.includes("topic_focus")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `topic_focus` JSON NULL;");
      console.log("Added topic_focus column to interview_requests.");
    }
    if (!colNames.includes("scheduled_date")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `scheduled_date` VARCHAR(50) NULL;");
    }
    if (!colNames.includes("scheduled_time")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `scheduled_time` VARCHAR(50) NULL;");
    }
    if (!colNames.includes("room_code")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `room_code` VARCHAR(50) NOT NULL;");
    }
    if (!colNames.includes("role_requirement")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `role_requirement` VARCHAR(150) NOT NULL;");
    }
    if (!colNames.includes("language")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `language` VARCHAR(50) NULL;");
    }
    if (!colNames.includes("status")) {
      await db.sequelize.query("ALTER TABLE `interview_requests` ADD COLUMN `status` ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending';");
    }

    await db.sequelize.query("ALTER TABLE `interview_requests` MODIFY `interviewer_user_id` CHAR(36) NULL;");

    try {
      const [invCols] = await db.sequelize.query("DESCRIBE `interviewers`;");
      const invColNames = invCols.map((c) => c.Field);
      if (!invColNames.includes("is_mentor")) {
        await db.sequelize.query("ALTER TABLE `interviewers` ADD COLUMN `is_mentor` TINYINT(1) NOT NULL DEFAULT 1;");
      }
    } catch (e) {}

    schemaEnsured = true;
  } catch (err) {
    console.warn("Schema check note:", err.message);
  }
}

exports.createInterviewRequest = async (data) => {
  await ensureInterviewRequestsSchema();
  const {
    candidateUserId,
    interviewerUserId,
    requestType = "direct",
    roleRequirement,
    language,
    topicFocus,
    scheduledDate,
    scheduledTime,
    roomCode,
    candidateNotes,
  } = data;

  if (!candidateUserId || !roleRequirement || !roomCode) {
    return {
      success: false,
      statusCode: 400,
      message: "Candidate ID, Role requirement, and Room Code are required.",
    };
  }

  const isOpenBroadcast = requestType === "open" || !interviewerUserId;

  let candidateUser = null;
  let interviewerUser = null;

  if (isOpenBroadcast) {
    candidateUser = await db.userModel.findByPk(candidateUserId);
  } else {
    [candidateUser, interviewerUser] = await Promise.all([
      db.userModel.findByPk(candidateUserId),
      db.userModel.findByPk(interviewerUserId),
    ]);

    if (!interviewerUser) {
      return {
        success: false,
        statusCode: 404,
        message: "Specified interviewer not found.",
      };
    }
  }

  const meetingLink = getGoogleMeetLink();

  const request = await db.interviewRequestModel.create({
    candidateUserId,
    interviewerUserId: isOpenBroadcast ? null : interviewerUserId,
    requestType: isOpenBroadcast ? "open" : "direct",
    roleRequirement,
    language,
    topicFocus: Array.isArray(topicFocus) ? topicFocus : [topicFocus],
    scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
    scheduledTime: scheduledTime || "Immediate",
    roomCode,
    meetingLink,
    candidateNotes,
    status: "pending",
  });

  const candidateName = candidateUser?.firstName
    ? `${candidateUser.firstName} ${candidateUser.lastName || ""}`.trim()
    : candidateUser?.username || "Candidate";
  const formattedTopics = (Array.isArray(topicFocus) ? topicFocus.join(", ") : topicFocus) || "DSA & System Design";

  if (isOpenBroadcast) {
    // Broadcast notification email to matching interviewers
    try {
      const matchingInterviewers = await db.interviewerModel.findAll({
        include: [
          {
            model: db.userModel,
            as: "user",
            attributes: ["userId", "email", "firstName", "lastName", "isActive"],
            where: { isActive: true },
          },
        ],
      });

      const broadcastHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #1E293B;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #38BDF8; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
            <p style="color: #94A3B8; font-size: 13px; margin-top: 4px; font-weight: 600;">⚡ New Open Matching Interview Request</p>
          </div>

          <div style="background-color: #080E18; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
            <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">New Matching Candidate Available! 🎯</h2>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
              Candidate <strong>${candidateName}</strong> has posted an open interview request matching your engineering expertise.
            </p>

            <div style="background-color: #0B151E; padding: 18px; border-radius: 12px; border: 1px solid #06B6D4; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8; width: 40%;"><strong>🎯 Target Role:</strong></td>
                  <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${roleRequirement}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;"><strong>💻 Coding Language:</strong></td>
                  <td style="padding: 6px 0; color: #22D3EE; font-weight: bold;">${language || "JavaScript"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;"><strong>📚 Focus Topics:</strong></td>
                  <td style="padding: 6px 0; color: #C084FC; font-weight: bold;">${formattedTopics}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;"><strong>📅 Preferred Date:</strong></td>
                  <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${scheduledDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94A3B8;"><strong>🕒 Preferred Slot:</strong></td>
                  <td style="padding: 6px 0; color: #34D399; font-weight: bold;">${scheduledTime}</td>
                </tr>
              </table>
            </div>

            ${candidateNotes ? `
              <div style="background-color: #0B151E; padding: 12px 16px; border-radius: 10px; border-left: 3px solid #38BDF8; margin-bottom: 20px;">
                <p style="margin: 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; font-weight: bold;">Candidate Note:</p>
                <p style="margin: 4px 0 0 0; color: #E2E8F0; font-size: 13px; font-style: italic;">"${candidateNotes}"</p>
              </div>
            ` : ""}

            <div style="text-align: center; margin-top: 20px;">
              <a href="http://localhost:3000/dashborads/interviewerDashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10B981, #06B6D4); color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
                Accept & Claim Interview on Dashboard →
              </a>
            </div>
          </div>
        </div>
      `;

      matchingInterviewers.forEach((inv) => {
        if (inv.user?.email) {
          sendEmail({
            to: inv.user.email,
            subject: `⚡ Open Technical Interview Opportunity: ${roleRequirement} [${scheduledTime}]`,
            html: broadcastHtml,
            text: `New open interview request from ${candidateName} for ${roleRequirement} at ${scheduledTime}. Log in to your Interviewer Dashboard to accept!`,
          }).catch((err) => console.error("Broadcast email error:", err.message));
        }
      });
    } catch (e) {
      console.warn("Could not dispatch broadcast emails:", e.message);
    }

    return {
      success: true,
      statusCode: 201,
      message: "Open interview request broadcasted! It is now visible on matching interviewers' dashboards.",
      data: request,
    };
  }

  // Direct request email notification
  const interviewerEmail = interviewerUser.email;
  const interviewerName = interviewerUser.firstName || "Interviewer";

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38BDF8; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 4px; font-weight: 600;">1-to-1 Technical Interview Request</p>
      </div>

      <div style="background-color: #080E18; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
        <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">Hello ${interviewerName}, 👋</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          You have received a new direct 1-to-1 interview booking request from candidate <strong>${candidateName}</strong> (<a href="mailto:${candidateUser?.email}" style="color: #38BDF8; text-decoration: none;">${candidateUser?.email}</a>).
        </p>

        <div style="background-color: #0B151E; padding: 18px; border-radius: 12px; border: 1px solid #06B6D4; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8; width: 40%;"><strong>🎯 Target Role:</strong></td>
              <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${roleRequirement}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>💻 Coding Language:</strong></td>
              <td style="padding: 6px 0; color: #22D3EE; font-weight: bold;">${language || "JavaScript"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>📚 Focus Topics:</strong></td>
              <td style="padding: 6px 0; color: #C084FC; font-weight: bold;">${formattedTopics}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>📅 Scheduled Date:</strong></td>
              <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${scheduledDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>🕒 Selected Slot:</strong></td>
              <td style="padding: 6px 0; color: #34D399; font-weight: bold;">${scheduledTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>🔑 Session Room Code:</strong></td>
              <td style="padding: 6px 0; color: #38BDF8; font-family: monospace; font-weight: bold; font-size: 14px;">${roomCode}</td>
            </tr>
          </table>
        </div>

        ${candidateNotes ? `
          <div style="background-color: #0B151E; padding: 12px 16px; border-radius: 10px; border-left: 3px solid #38BDF8; margin-bottom: 20px;">
            <p style="margin: 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; font-weight: bold;">Candidate Note / Message:</p>
            <p style="margin: 4px 0 0 0; color: #E2E8F0; font-size: 13px; font-style: italic;">"${candidateNotes}"</p>
          </div>
        ` : ""}

        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="${meetingLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10B981, #06B6D4); color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
            📹 Join Google Meet Video Call
          </a>
          <p style="color: #64748B; font-size: 11px; margin-top: 8px; font-family: monospace;">Meeting Link: ${meetingLink}</p>
        </div>

        <div style="text-align: center; margin-top: 16px;">
          <a href="http://localhost:3000/dashborads/interviewerDashboard" target="_blank" style="display: inline-block; background-color: #1E293B; color: #38BDF8; font-weight: 700; font-size: 12px; text-decoration: none; padding: 8px 20px; border-radius: 8px; border: 1px solid #334155;">
            Go to Interviewer Dashboard to Accept / Decline →
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} InterviewFlow Inc. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">Automated notification sent via Brevo SMTP.</p>
      </div>
    </div>
  `;

  sendEmail({
    to: interviewerEmail,
    subject: `🔔 New Direct Interview Request: ${roleRequirement} [Slot: ${scheduledTime}]`,
    html: emailHtml,
    text: `New direct interview request from ${candidateName} for ${roleRequirement} at ${scheduledTime}. Google Meet: ${meetingLink}. Room: ${roomCode}`,
  }).catch((err) => console.error("Email send error:", err.message));

  return {
    success: true,
    statusCode: 201,
    message: "Direct interview request submitted successfully! Interviewer notified via email.",
    data: request,
  };
};

exports.getCandidateRequests = async (candidateUserId) => {
  await ensureInterviewRequestsSchema();
  const requests = await db.interviewRequestModel.findAll({
    where: { candidateUserId },
    include: [
      {
        model: db.userModel,
        as: "interviewerUser",
        attributes: ["userId", "firstName", "lastName", "username", "email"],
      },
      {
        model: db.meetingLinkModel,
        as: "meetingDetails",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return {
    success: true,
    statusCode: 200,
    message: "Candidate interview requests fetched",
    data: requests,
  };
};

exports.getInterviewerRequests = async (interviewerUserId) => {
  await ensureInterviewRequestsSchema();
  const { Op } = require("sequelize");

  // Fetch both direct requests assigned to this interviewer AND open broadcast requests
  const requests = await db.interviewRequestModel.findAll({
    where: {
      [Op.or]: [
        { interviewerUserId },
        { interviewerUserId: null, status: "pending" },
      ],
    },
    include: [
      {
        model: db.userModel,
        as: "candidateUser",
        attributes: ["userId", "firstName", "lastName", "username", "email"],
      },
      {
        model: db.userModel,
        as: "interviewerUser",
        attributes: ["userId", "firstName", "lastName", "username", "email"],
      },
      {
        model: db.meetingLinkModel,
        as: "meetingDetails",
        required: false,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return {
    success: true,
    statusCode: 200,
    message: "Interviewer interview requests fetched",
    data: requests,
  };
};

exports.updateRequestStatus = async ({ requestId, interviewerUserId, status, note }) => {
  await ensureInterviewRequestsSchema();
  if (!requestId || !status) {
    return {
      success: false,
      statusCode: 400,
      message: "Request ID and status are required.",
    };
  }

  const validStatuses = ["pending", "accepted", "rejected", "completed"];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      statusCode: 400,
      message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
    };
  }

  const { Op } = require("sequelize");

  // Find request: either assigned to this interviewer, or an unassigned open request being claimed
  const request = await db.interviewRequestModel.findOne({
    where: {
      requestId,
      [Op.or]: [
        { interviewerUserId },
        { interviewerUserId: null, status: "pending" },
      ],
    },
    include: [
      {
        model: db.userModel,
        as: "candidateUser",
        attributes: ["userId", "firstName", "lastName", "username", "email"],
      },
      {
        model: db.userModel,
        as: "interviewerUser",
        attributes: ["userId", "firstName", "lastName", "username", "email"],
      },
    ],
  });

  if (!request) {
    return {
      success: false,
      statusCode: 404,
      message: "Interview request not found, or it has already been claimed by another interviewer.",
    };
  }

  const updateFields = { status };

  // If status is ACCEPTED: allocate an active Google Meet link from database with tag & 60-min timer
  if (status === "accepted") {
    const activeMeetLink = await allocateMeetingLink({
      requestId: request.requestId,
      durationMinutes: 60,
      tag: "live_technical_round",
    });
    updateFields.meetingLink = activeMeetLink;

    // If open broadcast request, assign to this interviewer
    if (!request.interviewerUserId) {
      updateFields.interviewerUserId = interviewerUserId;
    }
  }

  // If status is COMPLETED or REJECTED: release the link so it becomes available for other meetings
  if (status === "completed" || status === "rejected") {
    await releaseMeetingLink(request.requestId);
  }

  await request.update(updateFields);

  // Reload interviewer details if just claimed
  const updatedInterviewer = await db.userModel.findByPk(interviewerUserId);

  const candidateEmail = request.candidateUser?.email;
  const candidateName = request.candidateUser?.firstName || request.candidateUser?.username || "Candidate";
  const interviewerName = updatedInterviewer?.firstName || request.interviewerUser?.firstName || "Your Interviewer";

  if (candidateEmail) {
    const isAccepted = status === "accepted";
    const subject = isAccepted
      ? `Interview Confirmed: ${request.roleRequirement} with ${interviewerName} 🎉`
      : `Update on your Interview Request (${request.roleRequirement})`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 28px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #38BDF8; margin: 0; font-size: 22px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
          <p style="color: #94A3B8; font-size: 13px;">1-to-1 Interview Status Update</p>
        </div>

        <div style="background-color: #080E18; padding: 22px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #F8FAFC; font-size: 17px; margin-top: 0;">Hello ${candidateName},</h2>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.5;">
            ${
              isAccepted
                ? `Great news! <strong>${interviewerName}</strong> has <strong>ACCEPTED</strong> your interview request.`
                : status === "rejected"
                ? `Your interview request for <strong>${request.roleRequirement}</strong> could not be scheduled at this time.`
                : `Your interview session status is now: <strong>${status.toUpperCase()}</strong>.`
            }
          </p>

          ${
            isAccepted
              ? `
            <div style="background-color: #0B151E; padding: 14px; border-radius: 8px; border: 1px solid #10B981; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;"><strong>Target Role:</strong> <span style="color: #F8FAFC;">${request.roleRequirement}</span></p>
              <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;"><strong>Language:</strong> <span style="color: #34D399;">${request.language || "JavaScript"}</span></p>
              <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;"><strong>Scheduled Time:</strong> <span style="color: #F8FAFC;">${request.scheduledDate} (${request.scheduledTime})</span></p>
              <p style="margin: 4px 0; font-size: 14px; color: #10B981;"><strong>Room Code:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #38BDF8;">${request.roomCode}</span></p>
            </div>

            ${request.meetingLink ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${request.meetingLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10B981, #06B6D4); color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
                📹 Join Google Meet Video Call
              </a>
              <p style="color: #64748B; font-size: 11px; margin-top: 6px; font-family: monospace;">${request.meetingLink}</p>
            </div>
            ` : ""}

            <p style="color: #94A3B8; font-size: 12px;">Please enter the room at your scheduled time via your Candidate Dashboard.</p>
            `
              : ""
          }

          ${note ? `<p style="color: #94A3B8; font-size: 12px;"><strong>Note from Interviewer:</strong> ${note}</p>` : ""}
        </div>
      </div>
    `;

    sendEmail({
      to: candidateEmail,
      subject,
      html: emailHtml,
      text: `Your interview request status for ${request.roleRequirement} is now ${status}.`,
    }).catch((err) => console.error("Email send error:", err.message));
  }

  return {
    success: true,
    statusCode: 200,
    message: `Interview request marked as ${status} successfully!`,
    data: request,
  };
};

exports.rerouteRequestToOpenPool = async ({ requestId, candidateUserId }) => {
  await ensureInterviewRequestsSchema();
  const request = await db.interviewRequestModel.findOne({
    where: { requestId, candidateUserId },
    include: [{ model: db.userModel, as: "candidateUser" }],
  });

  if (!request) {
    return { success: false, statusCode: 404, message: "Interview request not found." };
  }

  // Release any previously held links
  await releaseMeetingLink(request.requestId);

  await request.update({
    requestType: "open",
    interviewerUserId: null,
    status: "pending",
  });

  // Broadcast to verified interviewers
  try {
    const candidateName = request.candidateUser?.firstName
      ? `${request.candidateUser.firstName} ${request.candidateUser.lastName || ""}`.trim()
      : "Candidate";

    const matchingInterviewers = await db.interviewerModel.findAll({
      include: [
        {
          model: db.userModel,
          as: "user",
          attributes: ["userId", "email", "firstName", "lastName", "isActive"],
          where: { isActive: true },
        },
      ],
    });

    matchingInterviewers.forEach((inv) => {
      if (inv.user?.email) {
        sendEmail({
          to: inv.user.email,
          subject: `⚡ Open Technical Interview Re-routed: ${request.roleRequirement} [${request.scheduledTime}]`,
          text: `Candidate ${candidateName} has re-routed their interview request to the Open Pool for ${request.roleRequirement}. Claim it on your dashboard!`,
        }).catch((err) => console.error("Broadcast email error:", err.message));
      }
    });
  } catch (e) {
    console.warn("Could not dispatch reroute broadcast:", e.message);
  }

  return {
    success: true,
    statusCode: 200,
    message: "Request successfully re-routed to Open Matching Pool! All available interviewers have been notified.",
    data: request,
  };
};

exports.reassignRequestToInterviewer = async ({ requestId, candidateUserId, newInterviewerUserId }) => {
  await ensureInterviewRequestsSchema();
  const [request, newInterviewer] = await Promise.all([
    db.interviewRequestModel.findOne({
      where: { requestId, candidateUserId },
      include: [{ model: db.userModel, as: "candidateUser" }],
    }),
    db.userModel.findByPk(newInterviewerUserId),
  ]);

  if (!request) {
    return { success: false, statusCode: 404, message: "Interview request not found." };
  }
  if (!newInterviewer) {
    return { success: false, statusCode: 404, message: "Selected interviewer not found." };
  }

  await releaseMeetingLink(request.requestId);

  await request.update({
    requestType: "direct",
    interviewerUserId: newInterviewerUserId,
    status: "pending",
  });

  // Notify new interviewer
  if (newInterviewer.email) {
    const candidateName = request.candidateUser?.firstName || "Candidate";
    sendEmail({
      to: newInterviewer.email,
      subject: `🔔 Direct Technical Guidance Request: ${request.roleRequirement}`,
      text: `Candidate ${candidateName} has assigned a direct technical mock interview request to you for ${request.roleRequirement}. Check your Interviewer Dashboard to accept!`,
    }).catch((err) => console.error("Email send error:", err.message));
  }

  return {
    success: true,
    statusCode: 200,
    message: `Request successfully reassigned to ${newInterviewer.firstName || "Interviewer"}!`,
    data: request,
  };
};
