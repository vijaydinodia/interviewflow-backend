const nodemailer = require("nodemailer");
const { loadTemplate } = require("../utils/templateLoader");

// Reusable Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_KEY || process.env.BREVO_API_KEY,
  },
});

// ─── 1. Generic Send ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `InterviewFlow <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent. MessageID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, error: error.message };
  }
};

// ─── 2. Welcome Email ────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user, options = {}) => {
  const name = user.firstName || user.username || "User";
  const roleName = (user.role || "candidate").toUpperCase();
  const plainPassword = options.plainPassword || null;
  const subject = `Welcome to InterviewFlow — Your Account Details 🚀`;

  // Build template values
  const values = {
    name,
    roleName,
    email: user.email,
    loginUrl: process.env.APP_URL || "http://localhost:3000/login",
    year: new Date().getFullYear(),
  };

  let html;

  if (plainPassword) {
    // Load template and inject password block manually
    const rawHtml = require("fs").readFileSync(
      require("path").join(__dirname, "../templates/welcome.html"),
      "utf-8"
    );

    // Replace the {{#if plainPassword}} block with the real content
    const passwordBlock = `
      <div style="margin:0 0 20px; padding:18px; background-color:#030712; border-radius:12px; border:1px solid #0284C7; text-align:center;">
        <p style="margin:0 0 10px; color:#38BDF8; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
          Your Auto-Generated Secure Password
        </p>
        <div style="display:inline-block; background-color:#0F172A; color:#4ADE80; font-family:monospace; font-size:22px; font-weight:800; letter-spacing:4px; padding:10px 22px; border-radius:8px; border:1px dashed #22C55E;">
          ${plainPassword}
        </div>
        <p style="margin:10px 0 0; color:#94A3B8; font-size:12px;">
          Login Email: <strong style="color:#FFFFFF;">${user.email}</strong>
        </p>
      </div>`;

    html = rawHtml
      .replace(/{{#if plainPassword}}[\s\S]*?{{\/if}}/g, passwordBlock)
      .replace(/{{name}}/g, name)
      .replace(/{{roleName}}/g, roleName)
      .replace(/{{email}}/g, user.email)
      .replace(/{{loginUrl}}/g, values.loginUrl)
      .replace(/{{year}}/g, values.year);
  } else {
    // No password — strip the conditional block
    html = loadTemplate("welcome", values);
  }

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text: `Welcome to InterviewFlow! Your role: ${roleName}. Login at: ${values.loginUrl}`,
  });
};

// ─── 3. Interview Invitation Email ──────────────────────────────────────────
const sendInterviewInvitationEmail = async ({ to, candidateName, roomCode, roleName, time }) => {
  const subject = `Your 1-to-1 Technical Interview Room: ${roomCode} 📹`;

  const html = loadTemplate("interview_invitation", {
    candidateName: candidateName || "Candidate",
    roleName: roleName || "Software Engineer",
    time: time || "Immediately",
    roomCode,
    loginUrl: process.env.APP_URL || "http://localhost:3000/login",
    year: new Date().getFullYear(),
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Your InterviewFlow interview room code is: ${roomCode}. Role: ${roleName}. Time: ${time}`,
  });
};

// ─── 4. Bug Report Confirmation Email ───────────────────────────────────────
const sendBugReportConfirmationEmail = async ({ to, reporterName, bugTitle, bugCategory, bugSeverity, bugId }) => {
  const subject = `Bug Report Received — We're On It! 🐞`;

  // Severity badge colors
  const severityColors = {
    critical: { bg: "rgba(239,68,68,0.15)",  color: "#F87171", border: "rgba(239,68,68,0.4)" },
    high:     { bg: "rgba(249,115,22,0.15)", color: "#FB923C", border: "rgba(249,115,22,0.4)" },
    medium:   { bg: "rgba(245,158,11,0.15)", color: "#FBBF24", border: "rgba(245,158,11,0.4)" },
    low:      { bg: "rgba(34,197,94,0.15)",  color: "#4ADE80", border: "rgba(34,197,94,0.4)" },
  };
  const sev = severityColors[bugSeverity?.toLowerCase()] || severityColors.medium;

  const html = loadTemplate("bug_report_confirmation", {
    reporterName: reporterName || "User",
    bugTitle: bugTitle || "Untitled",
    bugCategory: bugCategory || "General",
    bugSeverity: (bugSeverity || "medium").toUpperCase(),
    severityBgColor: sev.bg,
    severityColor: sev.color,
    severityBorderColor: sev.border,
    bugId: bugId || "N/A",
    loginUrl: process.env.APP_URL || "http://localhost:3000/login",
    year: new Date().getFullYear(),
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Hi ${reporterName}, your bug report "${bugTitle}" has been received and is now open. Report ID: ${bugId}`,
  });
};

// ─── 5. OTP Forgot Password Email ────────────────────────────────────────────
const sendOtpEmail = async ({ to, name, otpCode }) => {
  const subject = `Your Password Reset OTP: ${otpCode} 🔐`;
  const digits = String(otpCode).split("");

  const html = loadTemplate("otp_forgot_password", {
    name: name || "User",
    otpCode,
    d1: digits[0] || "",
    d2: digits[1] || "",
    d3: digits[2] || "",
    d4: digits[3] || "",
    d5: digits[4] || "",
    d6: digits[5] || "",
    loginUrl: process.env.APP_URL || "http://localhost:3000/forget",
    year: new Date().getFullYear(),
  });

  return await sendEmail({
    to,
    subject,
    html,
    text: `Your InterviewFlow password reset OTP is: ${otpCode}. It expires in 10 minutes.`,
  });
};

module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
  sendInterviewInvitationEmail,
  sendBugReportConfirmationEmail,
  sendOtpEmail,
};
