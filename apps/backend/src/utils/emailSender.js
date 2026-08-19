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

  if (!senderEmail && !brevoKey) {
    console.warn("⚠️ EMAIL_USER or BREVO_API_KEY is not yet configured in .env. Falling back to local OTP rescue logging.");
  }

  const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Vyapar App</h2><p>${options.message}</p></div>`;

  // 1. Try Brevo if key is available
  if (brevoKey && senderEmail) {
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

      if (response.ok) {
        console.log(`✅ Brevo email sent successfully to ${normalizedEmail}`);
        return;
      }
      console.warn("[Brevo Debug] Brevo API responded with non-200, trying SMTP fallback.");
    } catch (brevoError) {
      console.warn("[Brevo Debug] Brevo request error:", brevoError.message);
    }
  }

  // 2. Try Gmail SMTP if credentials exist
  if (senderEmail && gmailPassword) {
    try {
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
      return;
    } catch (smtpErr) {
      console.warn("⚠️ Gmail SMTP delivery failed:", smtpErr.message);
    }
  }

  // 3. Fallback: Log OTP to console so development and testing are never blocked
  const otpMatch = (options.message || '').match(/\b\d{6}\b/);
  const otpCode = otpMatch ? otpMatch[0] : 'N/A';

  console.log("\n===========================================================");
  console.log(`🔑 [OTP RESCUE LOG] Email to: ${normalizedEmail}`);
  console.log(`📩 Subject: ${options.subject}`);
  console.log(`🔢 OTP Code: >>> ${otpCode} <<<`);
  console.log("⚠️ Notice: To deliver emails directly to user inboxes, add EMAIL_USER & EMAIL_PASS or BREVO_API_KEY in apps/backend/.env");
  console.log("===========================================================\n");
};

export default sendEmail;