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
    const rawFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@interviewflow.com";
    const fromAddress = rawFrom.includes("@smtp-brevo.com") ? "no-reply@interviewflow.com" : rawFrom;

    const info = await transporter.sendMail({
      from: `InterviewFlow <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent successfully. MessageID:", info.messageId);
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

// ─── 6. Company Approval & Credentials Email ────────────────────────────────
const sendCompanyApprovalEmail = async (companyUser, companyProfile = {}) => {
  const companyName = companyProfile.companyName || companyUser.firstName || "Valued Partner Company";
  const email = companyUser.email;
  const loginUrl = process.env.APP_URL || "http://localhost:3000/login";
  const subject = `🎉 Company Account Approved! Access Credentials for ${companyName}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38BDF8; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 4px; font-weight: 600;">Enterprise Recruiter &amp; Company Portal</p>
      </div>

      <div style="background-color: #080E18; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
        <div style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ADE80; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
          ✓ Company Account Verified &amp; Approved
        </div>

        <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">Welcome, ${companyName}! 🏢</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Your company account registration has been reviewed and officially <strong>APPROVED</strong> by the Super Admin governance team. You now have full access to schedule interviews, manage company settings, and conduct engineering assessments.
        </p>

        <!-- Credentials Card -->
        <div style="background-color: #0B151E; padding: 20px; border-radius: 14px; border: 1px solid #0284C7; margin: 20px 0;">
          <p style="margin: 0 0 12px 0; color: #38BDF8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            🔑 Official Company Access Credentials
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8; width: 35%;"><strong>Company Name:</strong></td>
              <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Login Email:</strong></td>
              <td style="padding: 6px 0; color: #38BDF8; font-weight: bold; font-family: monospace;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Account Role:</strong></td>
              <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">Company Recruiter / Admin</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Verification Status:</strong></td>
              <td style="padding: 6px 0; color: #4ADE80; font-weight: bold;">Super Admin Approved ✓</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284C7 0%, #06B6D4 100%); color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 12px; shadow: 0 4px 12px rgba(6, 182, 212, 0.3);">
            Sign In to Company Dashboard →
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} InterviewFlow Inc. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Your company account for ${companyName} has been approved! Login with email: ${email} at ${loginUrl}`,
  });
};

// ─── 7. Company Pending Approval Email ──────────────────────────────────────
const sendCompanyPendingEmail = async (companyUser, options = {}) => {
  const companyName = options.companyName || companyUser.firstName || "Valued Company";
  const email = companyUser.email;
  const loginUrl = process.env.APP_URL || "http://localhost:3000/login";
  const subject = `📋 Company Registration Received — Pending Super Admin Review`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38BDF8; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 4px; font-weight: 600;">Company Registration Portal</p>
      </div>

      <div style="background-color: #080E18; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
        <div style="display: inline-block; background-color: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #FCD34D; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">
          ⏳ Pending Super Admin Approval
        </div>

        <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">Hello, ${companyName}! 🏢</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Thank you for registering on <strong>InterviewFlow</strong>! Your company account request has been successfully submitted and is currently under review by our Super Admin team.
        </p>

        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          You will receive a confirmation email with your access credentials once your account is <strong style="color: #4ADE80;">approved</strong>. This process typically takes <strong>24–48 hours</strong>.
        </p>

        <!-- Saved Credentials Card -->
        <div style="background-color: #0B151E; padding: 20px; border-radius: 14px; border: 1px solid #0284C7; margin: 20px 0;">
          <p style="margin: 0 0 12px 0; color: #38BDF8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            🔐 Your Registration Details (Save These)
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8; width: 40%;"><strong>Company Name:</strong></td>
              <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Registered Email:</strong></td>
              <td style="padding: 6px 0; color: #38BDF8; font-weight: bold; font-family: monospace;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Temp Password:</strong></td>
              <td style="padding: 6px 0; color: #4ADE80; font-weight: bold; font-family: monospace;">${options.plainPassword || "Will be emailed after approval"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Status:</strong></td>
              <td style="padding: 6px 0; color: #FCD34D; font-weight: bold;">⏳ Awaiting Super Admin Approval</td>
            </tr>
          </table>
        </div>

        <p style="color: #94A3B8; font-size: 13px;">
          If you have any questions, please contact our support team at <a href="mailto:support@interviewflow.com" style="color: #38BDF8;">support@interviewflow.com</a>
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} InterviewFlow Inc. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Hi ${companyName}, your company registration on InterviewFlow is pending Super Admin approval. You'll receive credentials via email once approved. Registered email: ${email}`,
  });
};

// ─── 8. Super Admin New Company Registration Alert ───────────────────────────
const sendSuperAdminNewCompanyAlert = async (companyUser, companyDetails = {}) => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.SMTP_USER;
  if (!superAdminEmail) {
    console.warn("SUPER_ADMIN_EMAIL not set — skipping super admin alert email.");
    return;
  }

  const companyName = companyDetails.companyName || companyUser.firstName || "Unknown Company";
  const subject = `🔔 New Company Registration Awaiting Approval — ${companyName}`;
  const dashboardUrl = process.env.SUPER_ADMIN_DASHBOARD_URL || `${process.env.APP_URL || "http://localhost:3000"}/dashborads/superAdminDashborad`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38BDF8; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 4px; font-weight: 600;">Super Admin Notification System</p>
      </div>

      <div style="background-color: #080E18; padding: 24px; border-radius: 16px; border: 1px solid #334155;">
        <div style="display: inline-block; background-color: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #FCA5A5; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">
          🔔 New Company Requires Approval
        </div>

        <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">New Company Registration</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          A new company has registered on <strong>InterviewFlow</strong> and is waiting for your approval. Please review the details below and take action from the Super Admin Dashboard.
        </p>

        <!-- Company Details -->
        <div style="background-color: #0B151E; padding: 20px; border-radius: 14px; border: 1px solid #0284C7; margin: 20px 0;">
          <p style="margin: 0 0 12px 0; color: #38BDF8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            🏢 Company Registration Details
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #94A3B8; width: 40%;"><strong>Company Name:</strong></td>
              <td style="padding: 6px 0; color: #F8FAFC; font-weight: bold;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Contact Email:</strong></td>
              <td style="padding: 6px 0; color: #38BDF8; font-family: monospace;">${companyUser.email}</td>
            </tr>
            ${companyDetails.contactPhone ? `<tr><td style="padding: 6px 0; color: #94A3B8;"><strong>Phone:</strong></td><td style="padding: 6px 0; color: #F8FAFC;">${companyDetails.contactPhone}</td></tr>` : ""}
            ${companyDetails.industry ? `<tr><td style="padding: 6px 0; color: #94A3B8;"><strong>Industry:</strong></td><td style="padding: 6px 0; color: #F8FAFC;">${companyDetails.industry}</td></tr>` : ""}
            ${companyDetails.companySize ? `<tr><td style="padding: 6px 0; color: #94A3B8;"><strong>Company Size:</strong></td><td style="padding: 6px 0; color: #F8FAFC;">${companyDetails.companySize}</td></tr>` : ""}
            ${companyDetails.location ? `<tr><td style="padding: 6px 0; color: #94A3B8;"><strong>Location:</strong></td><td style="padding: 6px 0; color: #F8FAFC;">${companyDetails.location}</td></tr>` : ""}
            ${companyDetails.website ? `<tr><td style="padding: 6px 0; color: #94A3B8;"><strong>Website:</strong></td><td style="padding: 6px 0; color: #38BDF8;"><a href="${companyDetails.website}" style="color: #38BDF8;">${companyDetails.website}</a></td></tr>` : ""}
            <tr>
              <td style="padding: 6px 0; color: #94A3B8;"><strong>Status:</strong></td>
              <td style="padding: 6px 0; color: #FCD34D; font-weight: bold;">⏳ Pending Your Approval</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 12px;">
            Review &amp; Approve in Dashboard →
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} InterviewFlow Inc. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: superAdminEmail,
    subject,
    html,
    text: `New company registration awaiting approval: ${companyName} (${companyUser.email}). Login to the Super Admin Dashboard to review: ${dashboardUrl}`,
  });
};

module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
  sendInterviewInvitationEmail,
  sendBugReportConfirmationEmail,
  sendOtpEmail,
  sendCompanyApprovalEmail,
  sendCompanyPendingEmail,
  sendSuperAdminNewCompanyAlert,
};
