const nodemailer = require("nodemailer");

// Create reusable Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_KEY || process.env.BREVO_API_KEY,
  },
});

// 1. Generic Send Email Function
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `InterviewFlow <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via Brevo. MessageID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email via Brevo SMTP:", error.message);
    return { success: false, error: error.message };
  }
};

// 2. Welcome Email for New Users (With Auto-Generated Password if provided)
const sendWelcomeEmail = async (user, options = {}) => {
  const name = user.firstName || user.username || "User";
  const roleName = (user.role || "candidate").toUpperCase();
  const subject = `Welcome to InterviewFlow — Your Account Details 🚀`;
  const plainPassword = options.plainPassword || null;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38BDF8; margin: 0; font-size: 24px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 4px;">Technical Interview & Google Meet Platform</p>
      </div>

      <div style="background-color: #080E18; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
        <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">Welcome, ${name}! 🎉</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Your InterviewFlow account has been created successfully. You are registered as an official <strong>${roleName}</strong>.
        </p>

        ${plainPassword ? `
        <div style="margin: 20px 0; padding: 16px; background-color: #030712; border-radius: 10px; border: 1px solid #0284C7; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #38BDF8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Your Auto-Generated 8-Character Secure Password:</p>
          <div style="display: inline-block; background-color: #0F172A; color: #4ADE80; font-family: monospace; font-size: 20px; font-weight: 800; letter-spacing: 3px; padding: 8px 18px; border-radius: 8px; border: 1px dashed #22C55E;">
            ${plainPassword}
          </div>
          <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 11px;">
            Registered Login Email: <strong style="color: #FFFFFF;">${user.email}</strong>
          </p>
        </div>
        ` : ""}

        <p style="color: #94A3B8; font-size: 13px; line-height: 1.5;">
          You can use these credentials to log in to your InterviewFlow account at any time.
        </p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="http://localhost:3000/login" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284C7 0%, #06B6D4 100%); color: #000000; font-weight: 800; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 8px;">
            Go to InterviewFlow Login →
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748B; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} InterviewFlow. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">Automated account notification sent via Brevo SMTP.</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: user.email, subject, html, text: `Welcome to InterviewFlow! Your password is: ${plainPassword || "Configured during registration"}` });
};

// 3. Interview Invitation Email (with 1-to-1 Room Code)
const sendInterviewInvitationEmail = async ({ to, candidateName, roomCode, roleName, time }) => {
  const subject = `Your 1-to-1 Technical Interview Room: ${roomCode} 📹`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B151E; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #1E293B;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38BDF8; margin: 0; font-size: 24px;">Interview<span style="color: #22D3EE;">Flow</span></h1>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 4px;">1-to-1 Technical Interview Invitation</p>
      </div>

      <div style="background-color: #080E18; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
        <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">Hello ${candidateName || "Candidate"},</h2>
        <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
          Your 1-to-1 live technical interview has been scheduled.
        </p>

        <div style="background-color: #0B151E; padding: 16px; border-radius: 8px; border: 1px solid #06B6D4; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;"><strong>Target Role:</strong> <span style="color: #F8FAFC;">${roleName || "Software Engineer"}</span></p>
          <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;"><strong>Scheduled Time:</strong> <span style="color: #F8FAFC;">${time || "Immediate"}</span></p>
          <p style="margin: 4px 0; font-size: 14px; color: #22D3EE;"><strong>Room Code:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #38BDF8;">${roomCode}</span></p>
        </div>

        <p style="color: #94A3B8; font-size: 12px; line-height: 1.5;">
          Please join the room 5 minutes prior. Ensure your webcam and microphone are tested.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({ to, subject, html, text: `Your InterviewFlow room code is ${roomCode}` });
};

module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
  sendInterviewInvitationEmail,
};
