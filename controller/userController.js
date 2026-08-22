const userService = require("../services/userService");

exports.createUser = async (req, res) => {
  try {
    let { username, email, password, firstName, lastName, fullName, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (fullName && (!firstName || !lastName)) {
      const parts = fullName.trim().split(/\s+/);
      firstName = firstName || parts[0] || "";
      lastName = lastName || parts.slice(1).join(" ") || "";
    }

    if (!username) {
      const emailPrefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      username = `${emailPrefix}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let targetRole = role;
    if (targetRole === "company") {
      targetRole = "admin";
    }

    const userData = {
      username,
      email,
      password,
      firstName: firstName || username,
      lastName: lastName || "",
      fullName: fullName || "",
      role: targetRole || "candidate",
      // Extra fields for role-specific tables
      companyName: req.body.companyName || fullName || firstName || null,
      title: req.body.title || null,
      department: req.body.department || null,
      currentRole: req.body.currentRole || null,
    };

    const result = await userService.createUser(userData);

    return res.status(201).json({
      success: true,
      message: "User account created successfully",
      data: {
        userId: result.userId,
        username: result.username,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
      },
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const path = err.errors?.[0]?.path;
      if (path === "email" || err.message?.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "An account with this email address already exists. Please log in instead.",
        });
      }
      return res.status(409).json({
        success: false,
        message: "Username or email is already in use.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected server error occurred. Please try again.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const result = await userService.login(req.body);

    if (!result.success) {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected server error occurred. Please try again.",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const result = await userService.forgotPassword(email);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected server error occurred.",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP code are required.",
      });
    }

    const result = await userService.verifyOtp(email, otpCode);

    return res.status(result.statusCode || 200).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected server error occurred.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, token, newPassword, password } = req.body;
    const targetPassword = newPassword || password;

    if (!targetPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    const result = await userService.resetPassword({
      email,
      resetToken: resetToken || token,
      newPassword: targetPassword,
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected server error occurred.",
    });
  }
};

// POST /user/send-test-email — Test Brevo SMTP connection
exports.sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email 'to' is required.",
      });
    }

    const { sendEmail } = require("../services/emailService");
    const result = await sendEmail({
      to,
      subject: "Test Email from InterviewFlow (Brevo SMTP) 🚀",
      text: "Hello! This is a test email sent from InterviewFlow using Brevo SMTP.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0B151E; color: white; border-radius: 12px;">
          <h2 style="color: #38BDF8;">InterviewFlow — Brevo Email Test ✓</h2>
          <p style="color: #CBD5E1;">Your Brevo SMTP configuration is working perfectly!</p>
          <p style="color: #94A3B8; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${to} via Brevo!`,
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send email via Brevo.",
        error: result.error,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error sending email.",
    });
  }
};

// POST /user/send-interview-invite — Send 1-to-1 interview invitation email
exports.sendInterviewInviteEmail = async (req, res) => {
  try {
    const { to, candidateName, roomCode, roleName, time } = req.body;
    if (!to || !roomCode) {
      return res.status(400).json({
        success: false,
        message: "Recipient 'to' and 'roomCode' are required.",
      });
    }

    const { sendInterviewInvitationEmail } = require("../services/emailService");
    const result = await sendInterviewInvitationEmail({
      to,
      candidateName,
      roomCode,
      roleName,
      time,
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Interview invitation sent to ${to}!`,
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send interview invitation email.",
        error: result.error,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error sending invitation email.",
    });
  }
};




