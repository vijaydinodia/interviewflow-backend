const userRepo = require("../repository/userRepo");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const saltRounds = 10;

exports.createUser = async (data) => {
  const { password } = data;

  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);

  const newData = {
    ...data,
    email: data.email ? data.email.toLowerCase() : data.email,
    password: hash,
  };

  return await userRepo.createUser(newData);
};

exports.login = async (data) => {
  const { email, password } = data;

  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      statusCode: 403,
      message: "Account is inactive. Please contact support.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
    };
  }

  const userPayload = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };

  // Generate token using jsonwebtoken
  const token = jwt.sign(
    userPayload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  return {
    success: true,
    statusCode: 200,
    message: "Login successful",
    token,
    user: userPayload,
  };
};

exports.forgotPassword = async (email) => {
  if (!email) {
    return {
      success: false,
      statusCode: 400,
      message: "Email is required.",
    };
  }

  const user = await userRepo.findUserByEmail(email);
  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: "No account found with this email address.",
    };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await userRepo.updateUser(user.userId, {
    resetToken,
    resetTokenExpires,
  });

  return {
    success: true,
    statusCode: 200,
    message: "Password reset link generated successfully.",
    resetToken,
  };
};

exports.resetPassword = async ({ email, resetToken, token, newPassword, password }) => {
  const targetPassword = newPassword || password;
  const targetToken = resetToken || token;

  if (!targetPassword) {
    return {
      success: false,
      statusCode: 400,
      message: "New password is required.",
    };
  }

  let user = null;
  if (targetToken) {
    user = await userRepo.findUserByResetToken(targetToken);
  }
  if (!user && email) {
    user = await userRepo.findUserByEmail(email);
  }

  if (!user) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid user or invalid password reset token.",
    };
  }

  if (user.resetTokenExpires && new Date(user.resetTokenExpires) < new Date()) {
    return {
      success: false,
      statusCode: 400,
      message: "Password reset token has expired. Please request a new link.",
    };
  }

  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(targetPassword, salt);

  await userRepo.updateUser(user.userId, {
    password: hash,
    resetToken: null,
    resetTokenExpires: null,
  });

  return {
    success: true,
    statusCode: 200,
    message: "Password has been reset successfully. You can now log in with your new password.",
  };
};


