import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS must be set in .env');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    }
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Sumaiya'99 Store" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`\n=== EMAIL SENT ===`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`=================\n`);

    return info;
  } catch (error) {
    console.error('sendEmail error:', error.message);
    throw error;
  }
};
