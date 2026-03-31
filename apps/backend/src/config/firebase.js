import admin from 'firebase-admin';

try {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountBase64) {
    // Decode the Base64 string back to a JSON string
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase with the decoded credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Ye .env se aayega
    });
    console.log("✅ Firebase initialized successfully!");
  } else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Firebase features will be disabled.");
  }
} catch (error) {
  // Ye ab aapko behtar error dega agar koi problem hui toh
  console.error("🔴 Firebase init failed:", error.message);
  // We don't exit here, so the server can still run without Firebase
}

export default admin;