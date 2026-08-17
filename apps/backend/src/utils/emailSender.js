/**
 * Sends an email using Brevo (Sendinblue) HTTP API.
 * Bypasses Render's SMTP port blocking.
 * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.message - Plain text email body.
 */
const sendEmail = async (options) => {
  const brevoKey = process.env.BREVO_API_KEY || process.env.brevo_api_key;
  const senderEmail = process.env.EMAIL_USER || process.env.email_user;

  console.log("[Brevo Debug] Key loaded:", !!brevoKey, brevoKey ? `${brevoKey.slice(0, 6)}...${brevoKey.slice(-4)}` : "missing");
  console.log("[Brevo Debug] Sender configured:", senderEmail || "missing");
  console.log("[Brevo Debug] Recipient:", options.email);

  if (!brevoKey) {
    console.error("🔴 BREVO_API_KEY is missing! Showing OTP in console instead.");
    console.log(`📧 [MOCK EMAIL to ${options.email}] Subject: ${options.subject} | Message: ${options.message}`);
    return;
  }

  if (!senderEmail) {
    console.error("🔴 EMAIL_USER is missing. Brevo requires a verified sender email. Email will fail.");
    throw new Error("EMAIL_USER is not configured. Add a verified Brevo sender email.");
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Vyapar App', email: senderEmail },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Vyapar App</h2><p>${options.message}</p></div>`
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

  if (!response.ok) {
    throw new Error(`Brevo email send failed: ${response.status} ${response.statusText}. ${JSON.stringify(parsedBody)}`);
  }
  
  console.log(`✅ HTTP Email sent successfully to ${options.email}`);
};

export default sendEmail;