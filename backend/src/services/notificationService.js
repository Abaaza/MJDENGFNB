import nodemailer from 'nodemailer';

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('❗ Email credentials not configured');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const transporter = createTransporter();

export async function sendReminder(project) {
  if (!transporter) return;
  const to = process.env.NOTIFY_TO || process.env.EMAIL_USER;
  const subject = `Reminder: ${project.id} still in ${project.status}`;
  const text = `Project ${project.id} for ${project.client} has been in status ${project.status} for more than 48 hours.`;
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log('📧 Reminder sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send reminder:', err);
  }
}