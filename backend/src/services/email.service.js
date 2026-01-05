// src/services/email.service.js

const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

// 1. Config SMTP Transport (ถ้าจะใช้ Gmail หรือ Mailgun ให้แก้ตรงนี้)
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USERNAME || 'user',
    pass: process.env.SMTP_PASSWORD || 'pass',
  },
});

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email?.from || 'noreply@example.com', to, subject, text };
  
  // ถ้ายังไม่ได้ config SMTP ให้แค่ Log ออกมาดู (จะได้เทสได้)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      logger.info(`📧 [Mock Email] To: ${to} | Subject: ${subject} | Body: ${text}`);
      return;
  }
  
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // สร้าง Link (สมมติว่า Frontend รันที่ localhost:3000)
  const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
};