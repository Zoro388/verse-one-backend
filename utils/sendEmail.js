const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Verse One Hotel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: attachments || [], // PDF or other files
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to:', to);
  } catch (err) {
    console.error('❌ Email Error:', err.message);
  }
};

module.exports = sendEmail;
