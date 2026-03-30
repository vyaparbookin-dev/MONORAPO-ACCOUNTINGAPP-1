import nodemailer from 'nodemailer';

/**
 * Sends an email using nodemailer.
 * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.message - Plain text email body.
 */
const sendEmail = async (options) => {
  // 1. Create a transporter (the service that will send the email)
  // We will use Gmail's SMTP for this example.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com'
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email address from .env
      pass: process.env.EMAIL_PASS, // Your email password or App Password from .env
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `Vyapar App <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: '<h1>You can also send HTML</h1>'
  };

  // 3. Actually send the email
  await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent successfully to ${options.email}`);
};

export default sendEmail;