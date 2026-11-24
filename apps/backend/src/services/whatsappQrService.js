import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
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

/**
 * Supported Multi-WhatsApp Channels:
 * 1. 'billing': Primary invoices, receipts, counter bills
 * 2. 'recovery': Payment reminders, ledger statements, due recovery
 * 3. 'marketing': Promotional offers, festival discounts, coupons
 */
export const WA_CHANNELS = ['billing', 'recovery', 'marketing'];

export function normalizeChannel(channel) {
  if (!channel || typeof channel !== 'string') return 'billing';
  const c = channel.trim().toLowerCase();
  if (WA_CHANNELS.includes(c)) return c;
  return 'billing';
}

// Active WhatsApp Sessions per company and channel: Map<"${companyId}__${channel}", sessionObj>
const sessions = new Map();

/**
 * Get or normalize company identifier
 */
function getCompanyKey(companyId) {
  return String(companyId || "default_shop").trim();
}

/**
 * Get composite session key: ${companyId}__${channel}
 */
export function getSessionKey(companyId, channel = 'billing') {
  const coKey = getCompanyKey(companyId);
  const chan = normalizeChannel(channel);
  return `${coKey}__${chan}`;
}

/**
 * Get auth directory for a specific company channel with backwards compatibility migration
 */
export function getAuthDir(companyId, channel = 'billing') {
  const coKey = getCompanyKey(companyId);
  const chan = normalizeChannel(channel);
  const newDir = path.join(AUTH_BASE_DIR, `${coKey}__${chan}`);
  const legacyDir = path.join(AUTH_BASE_DIR, coKey);

  // Backwards compatibility migration for primary billing channel
  if (chan === 'billing') {
    if (!fs.existsSync(newDir) && fs.existsSync(legacyDir)) {
      try {
        fs.renameSync(legacyDir, newDir);
        console.log(`[WhatsApp Engine] Migrated legacy auth dir ${legacyDir} -> ${newDir}`);
      } catch (e) {
        return legacyDir;
      }
    }
  }
  return newDir;
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
 * Initialize or get active WhatsApp session for a company & channel
 */
export async function initWhatsAppSession(companyId, channel = 'billing', forceNew = false) {
  const normChan = normalizeChannel(channel);
  const sessKey = getSessionKey(companyId, normChan);
  const existing = sessions.get(sessKey);

  // 1. If session exists and forceNew is false:
  // If socket is actively CONNECTED, return current connected state immediately
  if (existing && !forceNew) {
    if (existing.status === "CONNECTED" && existing.sock) {
      return {
        channel: normChan,
        status: existing.status,
        qrDataUrl: null,
        userPhone: existing.userPhone,
        userName: existing.userName,
        isConnected: true
      };
    }
    // If socket is actively alive and has a fresh QR ready or is initializing, return current state
    if (existing.sock && (existing.status === "QR_READY" || existing.status === "INITIALIZING") && existing.qrDataUrl) {
      console.log(`♻️ [WhatsApp Engine][${normChan}] Keeping existing active QR session alive for ${sessKey}`);
      return {
        channel: normChan,
        status: existing.status,
        qrDataUrl: existing.qrDataUrl,
        userPhone: existing.userPhone,
        userName: existing.userName,
        isConnected: false
      };
    }
  }

  const authDir = getAuthDir(companyId, normChan);
  const credsFile = path.join(authDir, "creds.json");
  let hasRegisteredCreds = false;
  if (fs.existsSync(credsFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(credsFile, "utf-8"));
      hasRegisteredCreds = Boolean(parsed && parsed.registered);
    } catch (e) {
      hasRegisteredCreds = false;
    }
  }

  // Preserve previous QR image in memory during reconnect so screen doesn't flicker or go blank
  const preservedQrDataUrl = existing?.qrDataUrl || null;
  const preservedQr = existing?.qr || null;

  // 2. Cleanly teardown any existing socket before opening a fresh one
  if (existing) {
    if (existing.reconnectTimer) {
      clearTimeout(existing.reconnectTimer);
      existing.reconnectTimer = null;
    }
    if (existing.sock) {
      try {
        existing.sock.ev.removeAllListeners();
        existing.sock.end(undefined);
      } catch (e) {}
      existing.sock = null;
    }
  }

  // 🛡️ If forcing new, or if credentials exist but were NEVER successfully registered/paired:
  // Wipe stale unauthenticated keys so WhatsApp handshake doesn't fail with "Try again"!
  if (forceNew || !hasRegisteredCreds) {
    if (fs.existsSync(authDir)) {
      try {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log(`🧹 [WhatsApp Engine][${normChan}] Cleared unauthenticated pairing cache for fresh scan in ${sessKey}`);
      } catch (e) {}
    }
  }

  if (!fs.existsSync(authDir)) {
    try {
      fs.mkdirSync(authDir, { recursive: true });
    } catch (e) {}
  }

  const sessionObj = {
    channel: normChan,
    sock: null,
    status: preservedQrDataUrl ? "QR_READY" : "INITIALIZING",
    qr: preservedQr,
    qrDataUrl: preservedQrDataUrl,
    userPhone: null,
    userName: null,
    isRegistered: hasRegisteredCreds,
    reconnectTimer: null
  };
  sessions.set(sessKey, sessionObj);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    sessionObj.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      // 🛡️ Guard: If this socket has been replaced by a newer one, ignore events
      if (sessions.get(sessKey)?.sock !== sock) {
        return;
      }

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        sessionObj.status = "QR_READY";
        sessionObj.qr = qr;
        try {
          sessionObj.qrDataUrl = await qrcode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: normChan === 'recovery' ? "#991B1B" : normChan === 'marketing' ? "#7C2D12" : "#065F46", light: "#FFFFFF" }
          });
        } catch (qrErr) {
          console.warn(`[WhatsApp Engine][${normChan}] QR to DataURL error:`, qrErr.message);
        }
        console.log(`📲 [WhatsApp Engine][${normChan}] Active QR code refreshed for ${sessKey}`);
      }

      if (connection === "open") {
        sessionObj.status = "CONNECTED";
        sessionObj.qr = null;
        sessionObj.qrDataUrl = null;
        sessionObj.isRegistered = true;
        if (sessionObj.reconnectTimer) {
          clearTimeout(sessionObj.reconnectTimer);
          sessionObj.reconnectTimer = null;
        }

        const rawId = sock.user?.id || "";
        const uPhone = rawId.split(":")[0]?.replace(/\D/g, "") || sock.user?.lid || "Unknown";
        sessionObj.userPhone = uPhone;
        sessionObj.userName = sock.user?.name || "व्यापारी";

        console.log(`✅ [WhatsApp Engine][${normChan}] Connected successfully for ${sessKey}! Phone: ${uPhone}`);
      }

      if (connection === "close") {
        // 🛡️ Guard: Only handle closure if this is still the active socket
        if (sessions.get(sessKey)?.sock !== sock) {
          return;
        }

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        console.log(`⚠️ [WhatsApp Engine][${normChan}] Connection closed for ${sessKey}. Code: ${statusCode}, LoggedOut: ${isLoggedOut}`);

        // Mark socket as closed
        sessionObj.sock = null;

        if (isLoggedOut) {
          sessionObj.status = "DISCONNECTED";
          sessionObj.qr = null;
          sessionObj.qrDataUrl = null;
          sessionObj.userPhone = null;
          sessionObj.isRegistered = false;
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {}
        } else if (statusCode !== DisconnectReason.connectionReplaced) {
          // If connection closed before ever completing registration (e.g. 408 timeout or handshake failure):
          // Wipe unauthenticated keys so next pairing attempt starts with fresh keys and doesn't say "Try again"!
          if (!sessionObj.isRegistered && fs.existsSync(authDir)) {
            try {
              fs.rmSync(authDir, { recursive: true, force: true });
            } catch (e) {}
          }

          // Keep QR visible on screen while reconnecting in background
          sessionObj.status = sessionObj.qrDataUrl ? "QR_READY" : "INITIALIZING";
          if (sessionObj.reconnectTimer) clearTimeout(sessionObj.reconnectTimer);
          sessionObj.reconnectTimer = setTimeout(() => {
            // Re-initialize cleanly without clashing
            initWhatsAppSession(companyId, normChan, false).catch((err) => {
              console.warn(`[WhatsApp Engine][${normChan}] Auto-reconnect notice:`, err.message);
            });
          }, 2000);
        }
      }
    });

    return {
      channel: normChan,
      status: sessionObj.status,
      qrDataUrl: sessionObj.qrDataUrl,
      userPhone: sessionObj.userPhone,
      userName: sessionObj.userName,
      isConnected: sessionObj.status === "CONNECTED"
    };
  } catch (initErr) {
    console.error(`[WhatsApp Engine][${normChan}] Init error for ${sessKey}:`, initErr.message);
    sessionObj.status = "DISCONNECTED";
    sessionObj.sock = null;
    return {
      channel: normChan,
      status: "DISCONNECTED",
      qrDataUrl: sessionObj.qrDataUrl || null,
      userPhone: null,
      userName: null,
      isConnected: false,
      error: initErr.message
    };
  }
}

/**
 * Get live WhatsApp connection status for a company across all 3 channels
 */
export function getWhatsAppStatus(companyId, requestedChannel = null) {
  const coKey = getCompanyKey(companyId);

  const getSingleChannelStatus = (ch) => {
    const sKey = `${coKey}__${ch}`;
    const sess = sessions.get(sKey);
    const authDir = getAuthDir(companyId, ch);
    const hasCreds = fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0;

    if (!sess) {
      return {
        channel: ch,
        status: hasCreds ? "INITIALIZING" : "DISCONNECTED",
        qrDataUrl: null,
        userPhone: null,
        userName: null,
        isConnected: false,
        hasSavedSession: hasCreds
      };
    }
    return {
      channel: ch,
      status: sess.status,
      qrDataUrl: sess.qrDataUrl,
      userPhone: sess.userPhone,
      userName: sess.userName,
      isConnected: sess.status === "CONNECTED",
      hasSavedSession: hasCreds
    };
  };

  const billing = getSingleChannelStatus('billing');
  const recoveryRaw = getSingleChannelStatus('recovery');
  const marketingRaw = getSingleChannelStatus('marketing');

  // Smart fallback indicator: if recovery or marketing is unlinked, it can inherit billing
  const recovery = {
    ...recoveryRaw,
    isInherited: !recoveryRaw.isConnected && billing.isConnected,
    effectivePhone: recoveryRaw.isConnected ? recoveryRaw.userPhone : (billing.isConnected ? billing.userPhone : null),
    effectiveStatus: recoveryRaw.isConnected ? recoveryRaw.status : (billing.isConnected ? 'INHERITED_BILLING' : recoveryRaw.status)
  };

  const marketing = {
    ...marketingRaw,
    isInherited: !marketingRaw.isConnected && billing.isConnected,
    effectivePhone: marketingRaw.isConnected ? marketingRaw.userPhone : (billing.isConnected ? billing.userPhone : null),
    effectiveStatus: marketingRaw.isConnected ? marketingRaw.status : (billing.isConnected ? 'INHERITED_BILLING' : marketingRaw.status)
  };

  const channels = { billing, recovery, marketing };

  const activeChannel = requestedChannel ? normalizeChannel(requestedChannel) : 'billing';
  const target = channels[activeChannel] || billing;

  return {
    channel: activeChannel,
    status: target.status,
    qrDataUrl: target.qrDataUrl,
    userPhone: target.userPhone,
    userName: target.userName,
    isConnected: target.isConnected,
    effectivePhone: target.effectivePhone || target.userPhone,
    isInherited: Boolean(target.isInherited),
    channels
  };
}

/**
 * Disconnect and logout company WhatsApp session for a specific channel
 */
export async function disconnectWhatsApp(companyId, channel = 'billing') {
  const normChan = normalizeChannel(channel);
  const sessKey = getSessionKey(companyId, normChan);
  const session = sessions.get(sessKey);

  if (session) {
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }
    if (session.sock) {
      try {
        session.sock.ev.removeAllListeners();
        await session.sock.logout();
      } catch (e) {
        try { session.sock.end(); } catch (e2) {}
      }
    }
  }

  sessions.delete(sessKey);

  const authDir = getAuthDir(companyId, normChan);
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch (e) {}
  }

  const chanNameHindi = normChan === 'recovery' ? 'उधारी वसूली' : normChan === 'marketing' ? 'मार्केटिंग' : 'बिलिंग';
  console.log(`🔌 [WhatsApp Engine] ${chanNameHindi} (${normChan}) session disconnected & wiped for ${companyId}`);
  return { 
    success: true, 
    channel: normChan,
    message: `${chanNameHindi} WhatsApp सफलतापूर्वक डिस्कनेक्ट हो गया!` 
  };
}

/**
 * Send WhatsApp text message in the background with Smart Fallback
 */
export async function sendDirectWhatsAppMessage(companyId, toMobile, messageText, targetChannel = 'billing') {
  const normChan = normalizeChannel(targetChannel);
  let sessKey = getSessionKey(companyId, normChan);
  let session = sessions.get(sessKey);
  let usedChannel = normChan;

  // 1. Attempt auto-restore for target channel if credentials exist
  if (!session || session.status !== "CONNECTED" || !session.sock) {
    const aDir = getAuthDir(companyId, normChan);
    if (fs.existsSync(aDir) && fs.readdirSync(aDir).length > 0) {
      await initWhatsAppSession(companyId, normChan, false);
      session = sessions.get(sessKey);
    }
  }

  // 2. Smart Fallback: If recovery or marketing is not connected, fallback to billing channel!
  if ((!session || session.status !== "CONNECTED" || !session.sock) && normChan !== 'billing') {
    const billingKey = getSessionKey(companyId, 'billing');
    let billingSession = sessions.get(billingKey);
    if (!billingSession || billingSession.status !== "CONNECTED" || !billingSession.sock) {
      const bDir = getAuthDir(companyId, 'billing');
      if (fs.existsSync(bDir) && fs.readdirSync(bDir).length > 0) {
        await initWhatsAppSession(companyId, 'billing', false);
        billingSession = sessions.get(billingKey);
      }
    }

    if (billingSession && billingSession.status === "CONNECTED" && billingSession.sock) {
      console.log(`ℹ️ [WhatsApp Engine] Channel '${normChan}' not linked. Falling back to primary 'billing' channel (${billingSession.userPhone}).`);
      session = billingSession;
      usedChannel = 'billing';
    }
  }

  // 3. Global Single-Engine Fallback: Check ANY connected WhatsApp channel for this company!
  if (!session || session.status !== "CONNECTED" || !session.sock) {
    for (const altChan of ['billing', 'recovery', 'marketing']) {
      const altKey = getSessionKey(companyId, altChan);
      let altSess = sessions.get(altKey);
      if (!altSess || altSess.status !== "CONNECTED" || !altSess.sock) {
        const altDir = getAuthDir(companyId, altChan);
        if (fs.existsSync(altDir) && fs.readdirSync(altDir).length > 0) {
          try {
            await initWhatsAppSession(companyId, altChan, false);
            altSess = sessions.get(altKey);
          } catch (e) {}
        }
      }
      if (altSess && altSess.status === "CONNECTED" && altSess.sock) {
        console.log(`ℹ️ [WhatsApp Engine] Unified Engine: Falling back from '${normChan}' to active channel '${altChan}' (${altSess.userPhone}).`);
        session = altSess;
        usedChannel = altChan;
        break;
      }
    }
  }

  if (!session || session.status !== "CONNECTED" || !session.sock) {
    return {
      success: false,
      isQrRequired: true,
      channel: normChan,
      message: "WhatsApp कनेक्ट नहीं है! कृपया बिज़नेस प्रोफाइल से QR कोड स्कैन करें।"
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
    console.log(`📤 [WhatsApp Engine][${usedChannel}] Message sent successfully to ${jid} (Msg ID: ${sentMsg?.key?.id}) via ${session.userPhone}`);
    return {
      success: true,
      messageId: sentMsg?.key?.id,
      usedChannel,
      senderPhone: session.userPhone,
      message: "संदेश बैकग्राउंड में सफलतापूर्वक भेज दिया गया!"
    };
  } catch (sendErr) {
    console.error(`[WhatsApp Engine][${usedChannel}] Send error to ${jid}:`, sendErr.message);
    return {
      success: false,
      channel: usedChannel,
      message: "संदेश भेजने में विफल: " + sendErr.message
    };
  }
}

/**
 * Auto-restore saved sessions across all channels on server boot
 */
export function autoRestoreWhatsAppSessions() {
  if (!fs.existsSync(AUTH_BASE_DIR)) return;
  try {
    const subDirs = fs.readdirSync(AUTH_BASE_DIR);
    for (const d of subDirs) {
      const fullP = path.join(AUTH_BASE_DIR, d);
      if (fs.statSync(fullP).isDirectory() && fs.readdirSync(fullP).length > 0) {
        let companyId = d;
        let channel = 'billing';
        if (d.includes('__')) {
          const parts = d.split('__');
          companyId = parts[0];
          channel = parts[1] || 'billing';
        } else {
          // migrate legacy dir to companyId__billing
          const newDir = path.join(AUTH_BASE_DIR, `${d}__billing`);
          if (!fs.existsSync(newDir)) {
            try {
              fs.renameSync(fullP, newDir);
              channel = 'billing';
            } catch (e) {}
          }
        }
        console.log(`🔄 [WhatsApp Engine] Restoring saved session for ${companyId} [${channel}]...`);
        initWhatsAppSession(companyId, channel, false).catch(e =>
          console.warn(`Failed to restore WA session for ${companyId} [${channel}]:`, e.message)
        );
      }
    }
  } catch (err) {
    console.warn("[WhatsApp Engine] Auto-restore warning:", err.message);
  }
}
