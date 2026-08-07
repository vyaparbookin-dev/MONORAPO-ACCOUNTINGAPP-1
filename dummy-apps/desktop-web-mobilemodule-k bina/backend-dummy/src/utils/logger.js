import SecurityLog from "../model/securitylog.js";

// Ye function automatically kis user ne kya kiya record karega
export const logActivity = async (req, action, entity, entityId, oldData = null, newData = null) => {
  try {
    if (!req.companyId || !req.user) return;
    
    // Sanitize sensitive data before logging
    const sanitize = (data) => {
      if (!data) return null;
      const { password, token, ...rest } = data;
      return rest;
    };

    const log = new SecurityLog({
      companyId: req.companyId,
      userId: req.user._id,
      userName: req.user.name,
      action: `${action} ${entity}`.toUpperCase(), // e.g., "CREATE BILL"
      details: `User ${req.user.name} performed action: ${action} on ${entity} with ID: ${entityId}`,
      changes: { before: sanitize(oldData), after: sanitize(newData) },
      timestamp: new Date()
    });
    
    await log.save();
  } catch (error) {
    console.error("Audit Log Error:", error.message);
  }
};