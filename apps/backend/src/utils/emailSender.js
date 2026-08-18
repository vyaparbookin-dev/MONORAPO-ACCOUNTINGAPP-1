/**
 * Sends an email using Brevo first, then falls back to Gmail SMTP if Brevo is disabled/unauthorized.
 * This keeps OTPs working even when Brevo keys are not enabled or expired.
 * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.message - Plain text email body.
 */
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const normalizedEmail = String(options?.email || '').trim().toLowerCase();
  const brevoKey = process.env.BREVO_API_KEY || process.env.brevo_api_key;
  const senderEmail = process.env.EMAIL_USER || process.env.email_user;
  const gmailPassword = process.env.EMAIL_PASS || process.env.email_pass;

  console.log("[Brevo Debug] Key loaded:", !!brevoKey, brevoKey ? `${brevoKey.slice(0, 6)}...${brevoKey.slice(-4)}` : "missing");
  console.log("[Brevo Debug] Sender configured:", senderEmail || "missing");
  console.log("[Brevo Debug] Recipient:", normalizedEmail);

  if (!normalizedEmail) {
    throw new Error('Recipient email is missing.');
  }

  if (!senderEmail) {
    console.error("🔴 EMAIL_USER is missing. OTP email cannot be sent.");
    throw new Error("EMAIL_USER is not configured. Add a verified sender email.");
  }

  const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Vyapar App</h2><p>${options.message}</p></div>`;

  // Prefer Brevo, but do not fail permanently if the key is disabled or unauthorized.
  if (brevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Vyapar App', email: senderEmail },
          to: [{ email: normalizedEmail }],
          subject: options.subject,
          htmlContent
        })
      });

      const responseText = await response.text();
      let parsedBody = {};
      try {
        parsedBody = responseText ? JSON.parse(responseText) : {};
      } catch {
        parsedBody = { raw: responseText };
      }

      console.log("[Brevo Debug] API status:", response.status, response.statusText);
      console.log("[Brevo Debug] API response:", JSON.stringify(parsedBody));

      if (response.ok) {
        console.log(`✅ Brevo email sent successfully to ${normalizedEmail}`);
        return;
      }

      console.warn("[Brevo Debug] Brevo failed, falling back to Gmail SMTP.", JSON.stringify(parsedBody));
    } catch (brevoError) {
      console.warn("[Brevo Debug] Brevo request threw an exception, falling back to Gmail SMTP.", brevoError.message);
    }
  } else {
    console.warn("[Brevo Debug] BREVO_API_KEY missing, falling back to Gmail SMTP.");
  }

  // Fallback delivery path using Gmail SMTP if available.
  if (!gmailPassword) {
    console.error("🔴 No valid email provider available. Brevo disabled and Gmail password missing.");
    throw new Error("Email delivery is not configured. Add BREVO_API_KEY or EMAIL_PASS.");
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: senderEmail,
      pass: gmailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailResult = await transporter.sendMail({
    from: `Vyapar App <${senderEmail}>`,
    to: normalizedEmail,
    subject: options.subject,
    text: options.message,
    html: htmlContent,
  });

  console.log(`✅ Gmail SMTP email sent successfully to ${normalizedEmail}. Message ID: ${mailResult.messageId}`);
};

export default sendEmail;