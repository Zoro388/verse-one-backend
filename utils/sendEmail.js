const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text, // Use plain text instead of HTML
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to:', to);
  } catch (err) {
    console.error('❌ Email Error:', err.message);
  }
};

module.exports = sendEmail;
