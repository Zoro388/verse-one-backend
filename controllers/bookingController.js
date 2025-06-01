const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const calculateNights = (checkIn, checkOut) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((checkOut - checkIn) / oneDay);
  return diffDays > 0 ? diffDays : 0;
};

// Admin: Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('roomId').sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User: Get bookings by the authenticated user
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id; // Use user from token, not params
    const bookings = await Booking.find({ userId }).populate('roomId').sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { userId, roomId, checkIn, checkOut, maxNumberOfAdults, userEmail, name } = req.body;

    if (!roomId || !checkIn || !checkOut || !maxNumberOfAdults || !userEmail || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    const totalPrice = nights * room.pricePerNight;

    // Fetch user firstname if userId provided, else fallback to client name
    let userFirstName = name;
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.firstName) {
        userFirstName = user.firstName;
      }
    }

    const booking = new Booking({
      userId: userId || null,
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      maxNumberOfAdults,
      totalPrice,
      status: 'pending',
      userEmail,
      name,
    });

    await booking.save();

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // User email HTML with personalized greeting
    const userEmailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4a90e2;">Booking Confirmation</h2>
        <p>Dear ${userFirstName},</p>
        <p>Thank you for your booking. Here are your booking details:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr style="background-color: #4a90e2; color: white;">
            <th style="padding: 8px; text-align: left;">Field</th>
            <th style="padding: 8px; text-align: left;">Details</th>
          </tr>
          <tr style="background-color: #f0f8ff;">
            <td style="padding: 8px;">Room Name</td>
            <td style="padding: 8px;">${room.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f0f8ff;">Check-In Date</td>
            <td style="padding: 8px; background-color: #f0f8ff;">${checkInDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f0f8ff;">Check-Out Date</td>
            <td style="padding: 8px; background-color: #f0f8ff;">${checkOutDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f0f8ff;">Number of Adults</td>
            <td style="padding: 8px; background-color: #f0f8ff;">${maxNumberOfAdults}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f0f8ff;">Total Price</td>
            <td style="padding: 8px; background-color: #f0f8ff;">$${totalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f0f8ff;">Status</td>
            <td style="padding: 8px; background-color: #f0f8ff;">${booking.status}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">We look forward to hosting you!</p>
        <p>Best Regards,<br/>Your Hotel Team</p>
      </div>
    `;

    // Admin email HTML with "HELLO ADMIN" greeting + client details
    const adminEmailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #e94e1b;">HELLO ADMIN</h2>
        <p>A new booking has been made with the following details:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr style="background-color: #e94e1b; color: white;">
            <th style="padding: 8px; text-align: left;">Field</th>
            <th style="padding: 8px; text-align: left;">Details</th>
          </tr>
          <tr style="background-color: #f8d7da;">
            <td style="padding: 8px;">Client Name</td>
            <td style="padding: 8px;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8d7da;">Client Email</td>
            <td style="padding: 8px; background-color: #f8d7da;">${userEmail}</td>
          </tr>
          <tr style="background-color: #f8d7da;">
            <td style="padding: 8px;">Room Name</td>
            <td style="padding: 8px;">${room.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8d7da;">Check-In Date</td>
            <td style="padding: 8px; background-color: #f8d7da;">${checkInDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8d7da;">Check-Out Date</td>
            <td style="padding: 8px; background-color: #f8d7da;">${checkOutDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8d7da;">Number of Adults</td>
            <td style="padding: 8px; background-color: #f8d7da;">${maxNumberOfAdults}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8d7da;">Total Price</td>
            <td style="padding: 8px;">$${totalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background-color: #f8d7da;">Status</td>
            <td style="padding: 8px; background-color: #f8d7da;">${booking.status}</td>
          </tr>
        </table>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Your Hotel" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Booking Confirmation',
        html: userEmailHTML,
      });

      await transporter.sendMail({
        from: `"Your Hotel" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Booking Alert',
        html: adminEmailHTML,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    res.status(201).json({ message: 'Booking created and confirmation emails sent', booking });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
