import Bill from "../model/bill.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import Expance from "../model/expance.js";
import { logActivity } from "../utils/logger.js";
import { google } from "googleapis";
import admin from "firebase-admin";

// Initialize Firebase Admin (Sirf tabhi chalega jab .env me keys hongi)
if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } catch (error) {
    console.error("Firebase init failed:", error.message);
  }
}

export const createBackup = async (req, res) => {
  try {
    const { companyId } = req;
    const { googleAccessToken } = req.body; // Frontend se aayega jab user "Sign in with Google" karega

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    // 1. Data Ikhattha Karein (Gather all company data)
    const [bills, products, parties, expenses] = await Promise.all([
      Bill.find({ companyId, isDeleted: false }),
      Product.find({ companyId, isActive: true }),
      Party.find({ companyId, isActive: true }),
      Expance.find({ companyId, isDeleted: false })
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      companyId,
      data: { bills, products, parties, expenses }
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const fileName = `vyapar_backup_${companyId}_${Date.now()}.json`;

    let driveSuccess = false;
    let firebaseSuccess = false;

    // 2. Upload to Firebase Storage
    if (admin.apps.length > 0) {
      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(`backups/${fileName}`);
        await file.save(backupJson, { contentType: "application/json" });
        firebaseSuccess = true;
      } catch (fbErr) { console.error("Firebase Error:", fbErr); }
    }

    // 3. Upload to User's Google Drive
    if (googleAccessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: googleAccessToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        await drive.files.create({ requestBody: { name: fileName }, media: { mimeType: 'application/json', body: backupJson } });
        driveSuccess = true;
      } catch (gdErr) { console.error("Drive Error:", gdErr); }
    }

    await logActivity(req, `Triggered Dual Cloud Backup. Firebase: ${firebaseSuccess}, Drive: ${driveSuccess}`);
    res.status(200).json({ success: true, message: "Backup Processed", results: { firebase: firebaseSuccess, googleDrive: driveSuccess } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};