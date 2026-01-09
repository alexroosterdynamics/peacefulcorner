import nodemailer from "nodemailer";

function formatRON(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("ro-RO").format(v);
}

function formatMoney(amount, currency) {
  const c = String(currency || "").toUpperCase();
  if (c === "RON") return `${formatRON(amount)} lei`;
  if (c === "EUR") return `€${Number(amount || 0)}`;
  return `${Number(amount || 0)} ${c || ""}`.trim();
}

function clean(s) {
  // keep emails readable/safe (no angle brackets)
  return String(s ?? "").replace(/[<>]/g, "");
}

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

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !EMAIL_FROM ||
    !BOOKING_NOTIFY_TO
  ) {
    throw new Error("Missing SMTP/EMAIL env vars");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE) === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const to = BOOKING_NOTIFY_TO.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const currency = booking?.pricing?.currency || "RON";
  const total = booking?.pricing?.total ?? booking?.pricing?.subtotal ?? 0;

  const subject = `New booking request: ${clean(booking.checkIn)} → ${clean(
    booking.checkOut
  )} (${booking?.guests?.adults ?? 1}A, ${booking?.guests?.children ?? 0}C)`;

  const details = clean(booking?.details || "");
  const detailsBlock = details ? `\nDetails:\n${details}\n` : "";

  const text =
`New booking request (PENDING)

Name: ${clean(booking.name)}
Phone: ${clean(booking.phone)}${detailsBlock ? "\n" : ""}${detailsBlock}Dates: ${clean(booking.checkIn)} → ${clean(booking.checkOut)}
Guests: Adults ${booking?.guests?.adults ?? 1}, Children ${booking?.guests?.children ?? 0}

Total (estimated): ${formatMoney(total, currency)}
Status: ${clean(booking.status)}
Created: ${new Date(booking.createdAt).toISOString()}
Booking ID: ${clean(booking._id)}
`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
  });
}
