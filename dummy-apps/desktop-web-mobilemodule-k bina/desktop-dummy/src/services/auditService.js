import { syncQueue } from "@repo/shared";

export const auditService = {
  logAction: async (actionType, entity, oldData, newData) => {
    const logEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `AUDIT-${Date.now()}`,
      actionType, // CREATE, UPDATE, DELETE
      entity,     // expense, bill, etc.
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      timestamp: new Date().toISOString(),
      syncStatus: 'pending'
    };

    console.log(`[AUDIT LOG] ${actionType} on ${entity}`, logEntry);

    // 1. Save Locally
    if (window.electron?.db?.saveAuditLog) { try { await window.electron.db.saveAuditLog(logEntry); } catch(e) {} }

    // 2. Push to Cloud MongoDB (So admin can track changes from anywhere)
    const payload = { action: `${actionType} on ${entity.toUpperCase()}`, details: logEntry };
    await syncQueue.enqueue({ entityId: logEntry.id, entity: 'audit', method: "POST", url: "/api/security/log", data: payload });
  }
};