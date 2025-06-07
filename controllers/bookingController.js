const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Room = require('../models/Room');
const User = require('../models/User');
const Booking = require('../models/Booking');

const naira = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`;

// Helper to generate booking confirmation PDF buffer
const generatePDF = (booking, dataFields) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text('Your Hotel Name', { align: 'center' }).moveDown(0.5);
    doc.fontSize(16).text('Booking Receipt', { align: 'center' }).moveDown(1);
    doc.fontSize(10).text(`Receipt No: ${booking._id}`, { align: 'center' }).moveDown(2);

    const tableTop = doc.y;
    const cellPadding = 5;
    const colWidths = [150, 300];

    for (let i = 0; i < dataFields.length; i++) {
      const row = dataFields[i];
      const y = tableTop + i * 25;

      doc.rect(50, y, colWidths[0], 25).stroke();
      doc.rect(50 + colWidths[0], y, colWidths[1], 25).stroke();

      doc.font('Helvetica-Bold').fontSize(10).text(row[0], 55, y + cellPadding, {
        width: colWidths[0] - 2 * cellPadding,
      });

      doc.font('Helvetica').fontSize(10).text(row[1], 55 + colWidths[0], y + cellPadding, {
        width: colWidths[1] - 2 * cellPadding,
      });
    }

    doc.moveDown(3);
    doc.fontSize(12).text('Scan for more info', { align: 'center' });
    doc.rect(220, doc.y + 10, 150, 50).stroke();
    doc.text('[Barcode]', 245, doc.y + 25);

    doc.moveDown(3).fontSize(12).fillColor('#333').text('Thank you for choosing Your Hotel.', { align: 'center' });

    doc.end();
  });
};

// Helper to generate email HTML content
const generateEmailHTML = (receiverName, dataFields, isAdmin = false) => {
  const headingColor = isAdmin ? '#e74c3c' : '#2E86C1';
  const greeting = isAdmin ? 'Hello Admin,' : `Dear <strong>${receiverName}</strong>,`;
  const note = isAdmin ? 'The following booking was just made:' : 'Thank you for booking with us! Your booking details are below:';

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f2f4f8;">
      <h2 style="color: ${headingColor};">Booking Confirmation</h2>
      <p>${greeting}</p>
      <p>${note}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr style="background-color: #e6f2ff;">
          <th style="text-align: left; padding: 8px; border: 1px solid #ccc;">Field</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ccc;">Details</th>
        </tr>
        ${dataFields.map(([field, detail]) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;">${field}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${detail}</td>
          </tr>
        `).join('')}
      </table>
      <p style="margin-top: 20px;">${isAdmin ? 'Receipt is attached.' : 'We look forward to hosting you!'}</p>
      <p>Best regards,<br/>Your Hotel Team</p>
    </div>
  `;
};

// POST /bookings - create new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      roomId,
      checkIn,
      checkOut,
      maxNumberOfAdults,
      userEmail,
      firstName,
      lastName,
      message,
      paymentStatus,
      totalPrice,
    } = req.body;

    // Validate required fields
    if (
      !roomId ||
      !checkIn ||
      !checkOut ||
      !maxNumberOfAdults ||
      !userEmail ||
      !firstName ||
      !paymentStatus ||
      totalPrice == null
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Use user firstName if userId is provided and user exists
    let userFirstName = firstName;
    if (userId) {
      const user = await User.findById(userId);
      if (user?.firstName) userFirstName = user.firstName;
    }

    // Create booking document
    const booking = new Booking({
      userId: userId || null,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      maxNumberOfAdults,
      userEmail,
      firstName,
      lastName,
      message,
      paymentStatus,
      totalPrice,
    });

    await booking.save();

    // Prepare data fields for email and PDF
    const dataFields = [
      ['First Name', firstName],
      ['Last Name', lastName || '-'],
      ['Email', userEmail],
      ['Room', room.name],
      ['Check-In', checkInDate.toDateString()],
      ['Check-Out', checkOutDate.toDateString()],
      ['Adults', maxNumberOfAdults],
      ['Payment Status', paymentStatus],
      ['Total Price', naira(totalPrice)],
      ['Message', message || '-'],
    ];

    // Generate PDF
    const pdfBuffer = await generatePDF(booking, dataFields);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: `"Your Hotel" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Booking Confirmation',
      html: generateEmailHTML(userFirstName, dataFields),
      attachments: [
        {
          filename: 'booking-summary.pdf',
          content: pdfBuffer,
        },
      ],
    });

    // Send notification email to admin
    await transporter.sendMail({
      from: `"Your Hotel" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Booking Alert',
      html: generateEmailHTML('Admin', dataFields, true),
      attachments: [
        {
          filename: 'booking-summary.pdf',
          content: pdfBuffer,
        },
      ],
    });

    return res.status(201).json({ message: 'Booking created and confirmation emails sent', booking });
  } catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /bookings - admin only, get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('roomId')
      .populate('userId')
      .sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /bookings/my-bookings - user only, get bookings for logged in user
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const bookings = await Booking.find({ userId })
      .populate('roomId')
      .sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
