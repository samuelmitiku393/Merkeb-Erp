import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  const tokenFromCookie = req.cookies?.accessToken;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({
      message: "Access token required"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Token expired"
      });
    }
    return res.status(403).json({
      message: "Invalid token"
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Role-based restrictions removed: all authenticated users have access
    next();
  };
};