const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Room = require('../models/Room');
const User = require('../models/User');
const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      roomId,
      checkIn,
      checkOut,
      maxNumberOfAdults,
      userEmail,
      name,
      paymentStatus,
      totalPrice,
    } = req.body;

    if (
      !roomId ||
      !checkIn ||
      !checkOut ||
      !maxNumberOfAdults ||
      !userEmail ||
      !name ||
      !paymentStatus ||
      totalPrice == null
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    let userFirstName = name;
    if (userId) {
      const user = await User.findById(userId);
      if (user?.firstName) userFirstName = user.firstName;
    }

    const booking = new Booking({
      userId: userId || null,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      maxNumberOfAdults,
      userEmail,
      name,
      paymentStatus,
      totalPrice,
    });

    await booking.save();

    const naira = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`;

    const dataFields = [
      ['Name', name],
      ['Email', userEmail],
      ['Room', room.name],
      ['Check-In', checkInDate.toDateString()],
      ['Check-Out', checkOutDate.toDateString()],
      ['Adults', maxNumberOfAdults],
      ['Payment Status', paymentStatus],
      ['Total Price', naira(totalPrice)],
    ];

    const generatePDF = () => {
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

    const pdfBuffer = await generatePDF();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const generateEmailHTML = (receiverName, isAdmin = false) => {
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

    await transporter.sendMail({
      from: `"Your Hotel" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Booking Confirmation',
      html: generateEmailHTML(userFirstName),
      attachments: [
        {
          filename: 'booking-summary.pdf',
          content: pdfBuffer,
        },
      ],
    });

    await transporter.sendMail({
      from: `"Your Hotel" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Booking Alert',
      html: generateEmailHTML('Admin', true),
      attachments: [
        {
          filename: 'booking-summary.pdf',
          content: pdfBuffer,
        },
      ],
    });

    res.status(201).json({ message: 'Booking created and confirmation emails sent', booking });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('roomId')
      .populate('userId')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ userId })
      .populate('roomId')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
