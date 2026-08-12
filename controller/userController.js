const userService = require("../services/userService");

exports.createUser = async (req, res) => {
  try {
    console.log(req.body);
    let { username, email, password, firstName, lastName, fullName, role } = req.body;

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

    const userData = {
      username,
      email,
      password,
      firstName: firstName || username,
      lastName: lastName || "",
      role: role || "candidate",
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
    const { email, password } = req.body;

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
      resetToken: result.resetToken,
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



