import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_BASE_DIR = path.resolve(__dirname, "../../data/wa_auth");

if (!fs.existsSync(AUTH_BASE_DIR)) {
  try {
    fs.mkdirSync(AUTH_BASE_DIR, { recursive: true });
  } catch (e) {}
}

// Active WhatsApp Sessions per company
// Map<companyId, { sock, status: 'DISCONNECTED'|'INITIALIZING'|'QR_READY'|'CONNECTED', qr: string, qrDataUrl: string, userPhone: string, userName: string }>
const sessions = new Map();

/**
 * Get or normalize company identifier
 */
function getCompanyKey(companyId) {
  return String(companyId || "default_shop").trim();
}

/**
 * Format Indian / International mobile numbers for WhatsApp JID
 */
export function formatToWhatsAppJid(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, "");
  if (!cleaned) return null;

  // If 10 digits (Standard Indian Mobile), prefix country code 91
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  // If 11 digits starting with 0, replace 0 with 91
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = "91" + cleaned.slice(1);
  }

  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Initialize or get active WhatsApp session for a company
 */
export async function initWhatsAppSession(companyId, forceNew = false) {
  const coKey = getCompanyKey(companyId);
  const existing = sessions.get(coKey);

  if (existing && !forceNew) {
    if (existing.status === "CONNECTED" && existing.sock) {
      return {
        status: existing.status,
        qrDataUrl: null,
        userPhone: existing.userPhone,
        isConnected: true
      };
    }
    if (existing.status === "QR_READY" && existing.qrDataUrl) {
      return {
        status: existing.status,
        qrDataUrl: existing.qrDataUrl,
        userPhone: null,
        isConnected: false
      };
    }
  }

  const authDir = path.join(AUTH_BASE_DIR, coKey);
  if (forceNew && fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch (e) {}
  }

  if (!fs.existsSync(authDir)) {
    try {
      fs.mkdirSync(authDir, { recursive: true });
    } catch (e) {}
  }

  const sessionObj = {
    sock: null,
    status: "INITIALIZING",
    qr: null,
    qrDataUrl: null,
    userPhone: null,
    userName: null
  };
  sessions.set(coKey, sessionObj);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: false,
      browser: ["Vyapar Billing App", "Chrome", "1.0.0"]
    });

    sessionObj.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        sessionObj.status = "QR_READY";
        sessionObj.qr = qr;
        try {
          sessionObj.qrDataUrl = await qrcode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: "#065F46", light: "#FFFFFF" }
          });
        } catch (qrErr) {
          console.warn("[WhatsApp Engine] QR to DataURL error:", qrErr.message);
        }
        console.log(`📲 [WhatsApp Engine] New QR code generated for company ${coKey}`);
      }

      if (connection === "open") {
        sessionObj.status = "CONNECTED";
        sessionObj.qr = null;
        sessionObj.qrDataUrl = null;

        const rawId = sock.user?.id || "";
        const uPhone = rawId.split(":")[0]?.replace(/\D/g, "") || sock.user?.lid || "Unknown";
        sessionObj.userPhone = uPhone;
        sessionObj.userName = sock.user?.name || "व्यापारी";

        console.log(`✅ [WhatsApp Engine] Connected successfully for ${coKey}! Phone: ${uPhone}`);
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        console.log(`⚠️ [WhatsApp Engine] Connection closed for ${coKey}. Code: ${statusCode}, LoggedOut: ${isLoggedOut}`);

        if (isLoggedOut) {
          sessionObj.status = "DISCONNECTED";
          sessionObj.sock = null;
          sessionObj.qrDataUrl = null;
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {}
        } else {
          // Reconnect automatically if connection dropped
          sessionObj.status = "INITIALIZING";
          setTimeout(() => {
            initWhatsAppSession(coKey, false).catch(() => {});
          }, 3000);
        }
      }
    });

    return {
      status: sessionObj.status,
      qrDataUrl: sessionObj.qrDataUrl,
      userPhone: sessionObj.userPhone,
      isConnected: sessionObj.status === "CONNECTED"
    };
  } catch (initErr) {
    console.error(`[WhatsApp Engine] Init error for ${coKey}:`, initErr.message);
    sessionObj.status = "DISCONNECTED";
    return {
      status: "DISCONNECTED",
      qrDataUrl: null,
      userPhone: null,
      isConnected: false,
      error: initErr.message
    };
  }
}

/**
 * Get live WhatsApp connection status for a company
 */
export function getWhatsAppStatus(companyId) {
  const coKey = getCompanyKey(companyId);
  const session = sessions.get(coKey);

  if (!session) {
    const authDir = path.join(AUTH_BASE_DIR, coKey);
    // If auth directory exists with creds, session can be initiated in background
    const hasCreds = fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0;
    return {
      status: hasCreds ? "INITIALIZING" : "DISCONNECTED",
      qrDataUrl: null,
      userPhone: null,
      isConnected: false,
      hasSavedSession: hasCreds
    };
  }

  return {
    status: session.status,
    qrDataUrl: session.qrDataUrl,
    userPhone: session.userPhone,
    userName: session.userName,
    isConnected: session.status === "CONNECTED"
  };
}

/**
 * Disconnect and logout company WhatsApp session
 */
export async function disconnectWhatsApp(companyId) {
  const coKey = getCompanyKey(companyId);
  const session = sessions.get(coKey);

  if (session && session.sock) {
    try {
      await session.sock.logout();
    } catch (e) {
      try { session.sock.end(); } catch (e2) {}
    }
  }

  sessions.delete(coKey);

  const authDir = path.join(AUTH_BASE_DIR, coKey);
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch (e) {}
  }

  console.log(`🔌 [WhatsApp Engine] Session disconnected & wiped for ${coKey}`);
  return { success: true, message: "WhatsApp सफलतापूर्वक डिस्कनेक्ट हो गया!" };
}

/**
 * Send WhatsApp text message in the background
 */
export async function sendDirectWhatsAppMessage(companyId, toMobile, messageText) {
  const coKey = getCompanyKey(companyId);
  let session = sessions.get(coKey);

  if (!session || session.status !== "CONNECTED" || !session.sock) {
    // Attempt auto-restore if credentials exist
    const authDir = path.join(AUTH_BASE_DIR, coKey);
    if (fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0) {
      await initWhatsAppSession(coKey, false);
      session = sessions.get(coKey);
    }
  }

  if (!session || session.status !== "CONNECTED" || !session.sock) {
    return {
      success: false,
      isQrRequired: true,
      message: "WhatsApp कनेक्ट नहीं है! कृपया पहले सेटिंग्स से QR कोड स्कैन करें।"
    };
  }

  const jid = formatToWhatsAppJid(toMobile);
  if (!jid) {
    return {
      success: false,
      message: "अमान्य मोबाइल नंबर! कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
    };
  }

  try {
    const sentMsg = await session.sock.sendMessage(jid, { text: messageText });
    console.log(`📤 [WhatsApp Engine] Message sent successfully to ${jid} (Msg ID: ${sentMsg?.key?.id})`);
    return {
      success: true,
      messageId: sentMsg?.key?.id,
      message: "संदेश बैकग्राउंड में सफलतापूर्वक भेज दिया गया!"
    };
  } catch (sendErr) {
    console.error(`[WhatsApp Engine] Send error to ${jid}:`, sendErr.message);
    return {
      success: false,
      message: "संदेश भेजने में विफल: " + sendErr.message
    };
  }
}

/**
 * Auto-restore saved sessions on server boot
 */
export function autoRestoreWhatsAppSessions() {
  if (!fs.existsSync(AUTH_BASE_DIR)) return;
  try {
    const subDirs = fs.readdirSync(AUTH_BASE_DIR);
    for (const d of subDirs) {
      const fullP = path.join(AUTH_BASE_DIR, d);
      if (fs.statSync(fullP).isDirectory() && fs.readdirSync(fullP).length > 0) {
        console.log(`🔄 [WhatsApp Engine] Restoring saved session for ${d}...`);
        initWhatsAppSession(d, false).catch(e => console.warn(`Failed to restore WA session for ${d}:`, e.message));
      }
    }
  } catch (err) {
    console.warn("[WhatsApp Engine] Auto-restore warning:", err.message);
  }
}
