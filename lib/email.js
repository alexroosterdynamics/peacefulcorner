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

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

  const ADMIN_URL = "https://www.peacefulcorneriasi.ro/administrator";



  const checkIn = clean(booking?.checkIn);
  const checkOut = clean(booking?.checkOut);
  const name = clean(booking?.name);
  const phone = clean(booking?.phone);
  const adults = booking?.guests?.adults ?? 1;
  const children = booking?.guests?.children ?? 0;

  const hasPets = Boolean(booking?.pets?.hasPets);
  const petsCountRaw = Number(booking?.pets?.count || 0);
  const petsCount = hasPets ? (petsCountRaw > 0 ? petsCountRaw : 1) : 0;

  const petsLabel = hasPets ? `Yes (${petsCount})` : "No";

  const status = clean(booking?.status || "pending");
  const createdIso = booking?.createdAt ? new Date(booking.createdAt).toISOString() : "";
  const bookingId = clean(booking?._id);

  const details = clean(booking?.details || "");
  const subject = `New booking request: ${checkIn} → ${checkOut} • ${formatMoney(total, currency)}`;


  // ---------- TEXT (fallback) ----------
  const detailsBlock = details ? `\nDetails:\n${details}\n` : "";
  const text =
    `New booking request (PENDING)

Name: ${name}
Phone: ${phone}${detailsBlock ? "\n" : ""}${detailsBlock}Dates: ${checkIn} → ${checkOut}
Guests: Adults ${adults}, Children ${children}

Total (estimated): ${formatMoney(total, currency)}
Status: ${status}
Created: ${createdIso}
Booking ID: ${bookingId}

Admin panel: ${ADMIN_URL}
`;

  // ---------- HTML (beautiful + responsive) ----------
  const htmlDetails = details
    ? `<tr>
         <td style="padding:14px 18px; border-top:1px solid #EAEAEA;">
           <div style="font-size:12px; color:#6B7280; margin-bottom:6px;">Details</div>
           <div style="font-size:14px; color:#111827; white-space:pre-wrap; line-height:1.5;">
             ${escapeHtml(details)}
           </div>
         </td>
       </tr>`
    : "";

  // Gmail-safe CTA button + fallback link
  const petsBlock = `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px; border-collapse:separate; border-spacing:0;">
    <tr>
      <td style="padding:12px 14px; background:#F9FAFB; border:1px solid #EAEAEA; border-radius:14px;">
        <div style="font-size:12px; color:#6B7280;">Pets</div>
        <div style="font-size:14px; font-weight:700; color:#111827; margin-top:4px;">
          ${escapeHtml(petsLabel)}
        </div>
      </td>
    </tr>
  </table>
`;
  const adminButtonBlock = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
      <tr>
        <td align="center">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${ADMIN_URL}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="18%" stroke="f" fillcolor="#111827">
            <w:anchorlock/>
            <center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">
              Open Admin Panel
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-- -->
          <a href="${ADMIN_URL}"
             style="display:block; width:100%; max-width:320px; background:#111827; color:#FFFFFF; text-decoration:none;
                    padding:14px 18px; border-radius:14px; font-weight:800; font-size:14px; text-align:center;">
            Open Admin Panel
          </a>
          <!--<![endif]-->

          <div style="font-size:12px; color:#6B7280; margin-top:10px; line-height:1.4;">
            If the button doesn’t work, open this link:<br/>
            <a href="${ADMIN_URL}" style="color:#111827; font-weight:700; word-break:break-word; text-decoration:underline;">
              ${ADMIN_URL}
            </a>
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0; padding:0; background:#F6F7FB;">
    <!-- Preheader (hidden) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      New booking request from ${escapeHtml(name)} for ${escapeHtml(checkIn)} → ${escapeHtml(checkOut)}.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F7FB; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%; max-width:640px;">
            <!-- Header -->
            <tr>
              <td style="padding:8px 4px 16px;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:14px; color:#6B7280;">
                  Booking Notification
                </div>
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:22px; font-weight:800; color:#111827; margin-top:6px;">
                  New booking request
                </div>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background:#FFFFFF; border:1px solid #EAEAEA; border-radius:18px; overflow:hidden; box-shadow:0 6px 20px rgba(17,24,39,0.06);">
                <!-- Top bar -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:16px 18px; background:#111827;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#D1D5DB;">
                        Status
                      </div>
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:16px; font-weight:700; color:#FFFFFF; margin-top:6px;">
                        ${escapeHtml(String(status).toUpperCase())}
                      </div>
                    </td>
                    <td style="padding:16px 18px; background:#111827;" align="right">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#D1D5DB;">
                        Total (estimated)
                      </div>
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:16px; font-weight:800; color:#FFFFFF; margin-top:6px;">
                        ${escapeHtml(formatMoney(total, currency))}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;">
                  <tr>
                    <td style="padding:18px;">
                      <div style="display:inline-block; padding:6px 10px; border-radius:999px; background:#F3F4F6; color:#111827; font-size:12px; font-weight:700;">
                        ${escapeHtml(checkIn)} → ${escapeHtml(checkOut)}
                      </div>

                      <div style="margin-top:14px;">
                        <div style="font-size:12px; color:#6B7280; margin-bottom:6px;">Guest</div>
                        <div style="font-size:18px; font-weight:800; color:#111827;">
                          ${escapeHtml(name || "—")}
                        </div>
                        <div style="font-size:14px; color:#374151; margin-top:4px;">
                          ${escapeHtml(phone || "—")}
                        </div>
                      </div>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px; border-collapse:separate; border-spacing:0;">
                        <tr>
                          <td style="padding:12px 14px; background:#F9FAFB; border:1px solid #EAEAEA; border-radius:14px;">
                            <div style="font-size:12px; color:#6B7280;">Guests</div>
                            <div style="font-size:14px; font-weight:700; color:#111827; margin-top:4px;">
                              Adults ${escapeHtml(adults)} • Children ${escapeHtml(children)} • Pets ${escapeHtml(petsLabel)}
                            </div>
                          </td>
                        </tr>
                      </table>
                      ${petsBlock}

                      ${adminButtonBlock}

                      <div style="margin-top:14px; font-size:12px; color:#6B7280; line-height:1.5;">
                        Created: <span style="color:#111827; font-weight:600;">${escapeHtml(createdIso || "—")}</span><br/>
                        Booking ID: <span style="color:#111827; font-weight:600;">${escapeHtml(bookingId || "—")}</span>
                      </div>
                    </td>
                  </tr>

                  ${htmlDetails}

                  <tr>
                    <td style="padding:14px 18px; border-top:1px solid #EAEAEA; background:#FAFAFA;">
                      <div style="font-size:12px; color:#6B7280; line-height:1.5;">
                        Tip: Open your admin calendar to approve or delete. (This email is a notification only.)
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 4px 0;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; font-size:12px; color:#9CA3AF;">
                  Sent automatically by your booking system.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text, // fallback
    html, // pretty version
  });
}
