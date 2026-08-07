import admin from 'firebase-admin';

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Render me \n ko sahi se read karne ke liye replace karna padta hai
    // Local .env me extra quotes ko remove karne ka logic
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');

    // Initialize Firebase with individual keys
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET // Ye .env se aayega
    });
    console.log("✅ Firebase initialized successfully with individual keys!");
  } else {
    console.warn("⚠️ Firebase keys (PROJECT_ID, PRIVATE_KEY, CLIENT_EMAIL) are not set. Firebase features disabled.");
  }
} catch (error) {
  // Ye ab aapko behtar error dega agar koi problem hui toh
  console.error("🔴 Firebase init failed:", error.message);
  // We don't exit here, so the server can still run without Firebase
}

export default admin;