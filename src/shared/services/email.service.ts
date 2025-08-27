import 'dotenv/config';
import nodemailer from 'nodemailer';

// Interface for email options
interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // This allows Node.js to connect to servers with self-signed certificates.
    // Necessary for environments with corporate proxies or intrusive antivirus software.
    rejectUnauthorized: false
  }
});

// Function to send an email
export const sendEmail = async (options: MailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"UpSkill Platform" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Could not send email.');
  }
}