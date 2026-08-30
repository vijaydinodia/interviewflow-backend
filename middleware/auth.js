const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // check header exists
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // check Bearer format
    const token = authHeader.startsWith("Bearer")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "interviewflow_secret_key");

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based authorization middleware
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied. User role not specified." });
    }

    const userRole = req.user.role.toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: Access requires one of the following roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};
