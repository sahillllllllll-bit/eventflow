/**
 * Professional ticket generator for event registrations
 * - generateTicketHTML : full standalone page (used for PDF generation & web view)
 * - generateTicketEmailHTML : alias kept for backwards compatibility
 */

export const generateTicketHTML = (ticketData) => {
  const {
    ticketId,
    attendeeName,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    qrCodeBase64,
    phone,
    email,
    eventColor = '#6C47FF',
  } = ticketData;

  // ── Resolve display time ──────────────────────────────────────────────────
  // Use eventTime if explicitly provided, otherwise extract from eventDate
  const displayTime = (() => {
    if (eventTime && eventTime !== 'TBA' && eventTime.trim() !== '') {
      return eventTime;
    }
    if (eventDate) {
      return new Date(eventDate).toLocaleTimeString('en-US', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return 'TBA';
  })();

  // ── Format date ───────────────────────────────────────────────────────────
  const dateObj = new Date(eventDate);
  const formattedDate = isNaN(dateObj)
    ? 'TBA'
    : dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric',
      });

  // ── Normalise QR to full data URI ─────────────────────────────────────────
  const qrSrc = qrCodeBase64
    ? qrCodeBase64.startsWith('data:')
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ticket – ${eventTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, ${eventColor}33 0%, #0f0f0f 60%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 32px 16px 48px;
      color: #212529;
    }

    .ticket {
      width: 100%;
      max-width: 680px;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    }

    /* ── Header ── */
    .ticket-header {
      background: ${eventColor};
      padding: 36px 32px 28px;
      text-align: center;
    }
    .ticket-header .brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
      margin-bottom: 10px;
    }
    .ticket-header h1 {
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      line-height: 1.25;
      margin-bottom: 8px;
    }
    .ticket-header .admit {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.65);
    }

    /* ── Body ── */
    .ticket-body {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0;
    }

    /* ── Info side ── */
    .ticket-info {
      padding: 28px 28px 28px 32px;
      border-right: 2px dashed #e0e0e0;
    }
    .attendee {
      font-size: 22px;
      font-weight: 800;
      color: ${eventColor};
      margin-bottom: 22px;
      line-height: 1.2;
      word-break: break-word;
    }
    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    .detail-icon {
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .detail-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 2px;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #222;
      line-height: 1.4;
    }

    /* ── QR side ── */
    .ticket-qr {
      padding: 28px 28px 28px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-width: 190px;
    }
    .qr-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #999;
      text-align: center;
    }
    .qr-wrapper {
      background: #f4f4f4;
      border: 2px solid #e8e8e8;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-wrapper img {
      width: 150px;
      height: 150px;
      display: block;
    }
    .qr-id {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      font-family: 'Courier New', monospace;
      color: ${eventColor};
      text-align: center;
      word-break: break-all;
    }

    /* ── Footer strip ── */
    .ticket-footer {
      background: #f8f8f8;
      border-top: 1px solid #ebebeb;
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .footer-id-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 3px;
    }
    .footer-id-value {
      font-size: 15px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      color: ${eventColor};
      letter-spacing: 1.5px;
    }
    .footer-note {
      font-size: 11px;
      color: #aaa;
      text-align: right;
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding: 13px 28px;
      background: ${eventColor};
      color: #fff;
      text-decoration: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      font-family: inherit;
    }
    .download-btn:hover { opacity: 0.88; }

    .copyright {
      margin-top: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      text-align: center;
    }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      body { padding: 20px 12px 40px; }
      .ticket-header { padding: 28px 20px 22px; }
      .ticket-header h1 { font-size: 20px; }
      .ticket-body { grid-template-columns: 1fr; }
      .ticket-info {
        padding: 24px 20px 20px;
        border-right: none;
        border-bottom: 2px dashed #e0e0e0;
      }
      .ticket-qr {
        padding: 24px 20px;
        min-width: unset;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
      }
      .qr-wrapper img { width: 130px; height: 130px; }
      .ticket-footer { flex-direction: column; align-items: flex-start; gap: 10px; }
      .footer-note { text-align: left; }
    }

    /* ── PDF / Print mode ── */
    @media print {
      body { background: #fff; padding: 0; min-height: unset; }
      .download-btn, .copyright { display: none !important; }
      .ticket {
        box-shadow: none;
        border-radius: 12px;
        border: 1px solid #ddd;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>

  <div class="ticket">
    <div class="ticket-header">
      <div class="brand">EventGlow</div>
      <h1>${eventTitle}</h1>
      <div class="admit">✦ Admit One ✦</div>
    </div>

    <div class="ticket-body">

      <div class="ticket-info">
        <div class="attendee">${attendeeName}</div>

        <div class="detail-row">
          <div class="detail-icon">📅</div>
          <div>
            <div class="detail-label">Date</div>
            <div class="detail-value">${formattedDate}</div>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-icon">🕐</div>
          <div>
            <div class="detail-label">Time</div>
            <div class="detail-value">${displayTime}</div>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-icon">📍</div>
          <div>
            <div class="detail-label">Location</div>
            <div class="detail-value">${eventLocation || 'TBA'}</div>
          </div>
        </div>

        ${phone || email ? `
        <div class="detail-row">
          <div class="detail-icon">📞</div>
          <div>
            <div class="detail-label">Contact</div>
            <div class="detail-value">${phone || email}</div>
          </div>
        </div>` : ''}
      </div>

      <div class="ticket-qr">
        <div class="qr-label">Scan at entry</div>
        <div class="qr-wrapper">
          ${qrSrc
            ? `<img src="${qrSrc}" alt="QR Code" />`
            : `<div style="width:150px;height:150px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">No QR</div>`
          }
        </div>
        <div class="qr-id">${ticketId}</div>
      </div>

    </div>

    <div class="ticket-footer">
      <div>
        <div class="footer-id-label">Ticket ID</div>
        <div class="footer-id-value">${ticketId}</div>
      </div>
      <div class="footer-note">Non-transferable · Keep this ticket safe</div>
    </div>
  </div>

  <button class="download-btn" onclick="window.print()">
    ⬇ Download / Print Ticket
  </button>

  <div class="copyright">© ${new Date().getFullYear()} EventGlow. All rights reserved.</div>

</body>
</html>`;
};

export const generateTicketEmailHTML = generateTicketHTML;