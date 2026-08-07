export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user is set by your authmiddleware.js (protect)
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Your role (${req.user?.role || 'unknown'}) is not allowed to perform this action.`
      });
    }

    next();
  };
};