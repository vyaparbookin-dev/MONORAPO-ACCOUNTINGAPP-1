import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { manualSyncHandler } from "../middleware/offlinesyncmiddleware.js";

const router = express.Router();

/**
 * POST /api/sync/data
 * Endpoint for frontend to sync offline data to backend
 * Expects: { collectionName: string, data: array[] }
 */
router.post("/data", protect, manualSyncHandler);

/**
 * GET /api/sync/status
 * Check sync status for current user
 */
router.get("/status", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      userId: req.user._id,
      lastSync: new Date(),
      message: "Sync status OK"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
