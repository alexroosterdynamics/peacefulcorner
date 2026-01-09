import nodemailer from "nodemailer";

export async function sendBookingEmail({ booking }) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    BOOKING_NOTIFY_TO,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !BOOKING_NOTIFY_TO) {
    throw new Error("Missing SMTP/EMAIL env vars");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE) === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const to = BOOKING_NOTIFY_TO.split(",").map((s) => s.trim()).filter(Boolean);

  const subject = `New booking request: ${booking.checkIn} → ${booking.checkOut} (${booking.guests.adults}A, ${booking.guests.children}C)`;

  const text =
`New booking request (PENDING)

Name: ${booking.name}
Phone: ${booking.phone}

Dates: ${booking.checkIn} → ${booking.checkOut}
Guests: Adults ${booking.guests.adults}, Children ${booking.guests.children}

Total (estimated): €${booking.pricing.total}
Status: ${booking.status}
Created: ${new Date(booking.createdAt).toISOString()}
Booking ID: ${booking._id}
`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
  });
}
