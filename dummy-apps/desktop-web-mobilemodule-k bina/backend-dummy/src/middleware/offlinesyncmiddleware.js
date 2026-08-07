/**
 * Sync offline data to database when connection is restored
 * This middleware handles bidirectional sync between local and remote data
 */
export const syncOfflineData = async (localModel, remoteModel) => {
  try {
    const unsyncedData = await localModel.find({ synced: false });

    for (const doc of unsyncedData) {
      await remoteModel.updateOne({ _id: doc._id }, doc, { upsert: true });
      doc.synced = true;
      await doc.save();
    }

    console.log("✅ Offline data synced to Atlas");
    return { success: true, count: unsyncedData.length };
  } catch (error) {
    console.error("❌ Error syncing offline data:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Middleware function to check and sync unsynced records on every request
 */
export const offlineSyncMiddleware = async (req, res, next) => {
  try {
    // Check if user has unsynced data and sync if connection is available
    if (req.user) {
      const unsyncedCount = await req.app.locals.db?.collection("unsynced").countDocuments?.({ userId: req.user._id }) || 0;
      if (unsyncedCount > 0) {
        console.log(`⏳ User ${req.user._id} has ${unsyncedCount} unsynced records`);
        // Sync will happen in background
      }
    }
    next();
  } catch (error) {
    console.warn("Sync check failed, continuing:", error.message);
    next();
  }
};

/**
 * Endpoint to manually trigger sync from frontend
 */
export const manualSyncHandler = async (req, res) => {
  try {
    const { collectionName, data } = req.body;
    
    if (!collectionName || !Array.isArray(data)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payload: requires collectionName and data array" 
      });
    }

    let syncedCount = 0;
    for (const record of data) {
      try {
        // Try to upsert each record
        await req.app.locals.db?.collection(collectionName).updateOne(
          { _id: record._id || record.id },
          { $set: record },
          { upsert: true }
        );
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync record ${record._id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `${syncedCount} of ${data.length} records synced`,
      syncedCount,
      totalCount: data.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
