import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export const sendEmail = async (options: any) => {
  // 1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  } as SMTPTransport.Options);

  // 2) defind the email options
  const emailOptions = {
    from: 'Tran Chien Thang <ctb0k33@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) send the email with nodemailer
  await transporter.sendMail(emailOptions);
};
