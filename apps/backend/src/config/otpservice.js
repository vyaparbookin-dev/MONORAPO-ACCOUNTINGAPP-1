import dotenv from "dotenv";
import nodemailer from "nodemailer";
import twilio from "twilio";

dotenv.config();

// Email OTP Service
export const sendEmailOtp = async (toEmail, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ OTP sent via email");
  } catch (err) {
    console.error("❌ Email OTP Error:", err.message);
  }
};

// SMS OTP Service
export const sendSmsOtp = async (toNumber, otp) => {
  try {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toNumber,
    });
    console.log("✅ OTP sent via SMS");
  } catch (err) {
    console.error("❌ SMS OTP Error:", err.message);
  }
};