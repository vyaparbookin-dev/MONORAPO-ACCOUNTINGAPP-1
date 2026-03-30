/**
 * Sends an email using Brevo (Sendinblue) HTTP API.
 * Bypasses Render's SMTP port blocking.
 * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.message - Plain text email body.
 */
const sendEmail = async (options) => {
  if (!process.env.BREVO_API_KEY) {
    console.error("🔴 BREVO_API_KEY is missing! Showing OTP in console instead.");
    console.log(`📧 [MOCK EMAIL to ${options.email}] Subject: ${options.subject} | Message: ${options.message}`);
    return;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Vyapar App', email: process.env.EMAIL_USER || 'no-reply@vyapar.com' },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Vyapar App</h2><p>${options.message}</p></div>`
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }
  
  console.log(`✅ HTTP Email sent successfully to ${options.email}`);
};

export default sendEmail;