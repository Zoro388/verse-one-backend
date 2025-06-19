const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');

exports.createContact = async (req, res) => {
  try {
    const { email, fullName, message, number } = req.body;

    if (!email || !fullName || !message) {
      return res.status(400).json({ message: 'Email, fullName, and message are required' });
    }

    const newContact = new Contact({
      email,
      fullName,
      message,
      number: number || '',
    });

    await newContact.save();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL is not defined in .env");
      return res.status(500).json({ message: "Admin email not configured" });
    }

    const subject = '📬 New Contact Message - VERSE ONE HOTEL';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <div style="padding: 20px; border-bottom: 1px solid #eee; background-color: #004080; color: white; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h2 style="margin: 0;">📬 New Contact Message</h2>
            <p style="margin: 0; font-size: 14px;">Verse One Hotel</p>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; margin-bottom: 10px;">Hello Admin,</p>
            <p style="margin-bottom: 20px;">You have received a new message from the contact form. Here are the details:</p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Full Name</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Email</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Phone Number</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${number || 'N/A'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Message</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${message}</td>
              </tr>
            </table>

            <p style="margin-top: 20px; font-size: 14px; color: #777;">This is an automated message from the Verse One Hotel Website.</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject,
      html,
    });

    res.status(201).json({ message: 'Contact message received and email sent successfully' });
  } catch (error) {
    console.error('Contact creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
