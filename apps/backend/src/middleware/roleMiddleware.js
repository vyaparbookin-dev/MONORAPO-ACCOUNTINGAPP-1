export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user is set by authmiddleware.js (protect)
    const userRole = (req.user?.role || 'admin').toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());
    
    // Admin, owner, or allowed roles always have access
    if (userRole === 'admin' || userRole === 'owner' || normalizedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access Denied: Your role (${req.user?.role || 'unknown'}) is not allowed to perform this action.`
    });
  };
};