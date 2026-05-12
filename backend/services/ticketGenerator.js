/**
 * Professional ticket generator for event registrations
 * Generates beautiful, production-quality ticket emails and downloadable HTML
 */

export const generateTicketHTML = (ticketData) => {
  const {
    ticketId,
    attendeeName,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    eventImage,
    qrCodeBase64,
    phone,
    email,
    eventColor = '#6C47FF',
  } = ticketData;

  // Format date and time
  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Ticket - ${eventTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            width: 100%;
        }
        
        .email-wrapper {
            background-color: #f8f9fa;
            padding: 40px 20px;
        }
        
        .ticket-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            margin-bottom: 30px;
        }
        
        .ticket-header {
            background: linear-gradient(135deg, ${eventColor} 0%, ${eventColor}dd 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .ticket-header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .ticket-header p {
            font-size: 16px;
            opacity: 0.95;
        }
        
        .ticket-body {
            padding: 40px 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        .ticket-info {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        
        .ticket-qr {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
        }
        
        .qr-code-wrapper {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #e9ecef;
        }
        
        .qr-code-wrapper img {
            max-width: 250px;
            height: auto;
            display: block;
        }
        
        .info-section {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .info-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6c757d;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #212529;
            word-break: break-word;
        }
        
        .divider {
            height: 1px;
            background: #e9ecef;
            margin: 10px 0;
        }
        
        .attendee-name {
            font-size: 24px;
            font-weight: 700;
            color: ${eventColor};
            margin-bottom: 10px;
        }
        
        .event-details {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .detail-item {
            display: flex;
            gap: 15px;
            align-items: flex-start;
        }
        
        .detail-icon {
            font-size: 24px;
            color: ${eventColor};
            min-width: 30px;
            text-align: center;
        }
        
        .detail-content {
            flex: 1;
        }
        
        .detail-content p {
            margin: 4px 0;
            line-height: 1.6;
        }
        
        .detail-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6c757d;
            font-weight: 600;
        }
        
        .detail-text {
            font-size: 16px;
            color: #212529;
            font-weight: 500;
        }
        
        .ticket-footer {
            background: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .ticket-id {
            text-align: left;
        }
        
        .ticket-id-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #6c757d;
            letter-spacing: 0.5px;
        }
        
        .ticket-id-value {
            font-size: 16px;
            font-weight: 700;
            color: ${eventColor};
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        
        .ticket-instructions {
            font-size: 12px;
            color: #6c757d;
            text-align: right;
            max-width: 300px;
        }
        
        .email-message {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        
        .email-greeting {
            font-size: 18px;
            color: #212529;
            margin-bottom: 15px;
        }
        
        .email-greeting strong {
            color: ${eventColor};
        }
        
        .email-text {
            font-size: 14px;
            color: #6c757d;
            line-height: 1.8;
            margin-bottom: 15px;
        }
        
        .footer-text {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
            line-height: 1.8;
        }
        
        .footer-text strong {
            color: #212529;
        }
        
        @media (max-width: 768px) {
            .ticket-body {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .ticket-footer {
                flex-direction: column;
                text-align: center;
            }
            
            .ticket-footer .ticket-id,
            .ticket-footer .ticket-instructions {
                text-align: center;
            }
            
            .ticket-header h1 {
                font-size: 24px;
            }
            
            .attendee-name {
                font-size: 20px;
            }
        }
        
        .badge {
            display: inline-block;
            background: ${eventColor};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="email-message">
                <div class="email-greeting">
                    Welcome, <strong>${attendeeName}</strong>! 🎉
                </div>
                <div class="email-text">
                    Your registration for <strong>${eventTitle}</strong> is confirmed! Your ticket is ready below. 
                    Make sure to have this ticket with you at the event. You can download, screenshot, or print it.
                </div>
                <div class="email-text">
                    <strong>Important:</strong> Arrive 15 minutes early. Save your QR code – you'll need it for check-in!
                </div>
            </div>
            
            <div class="ticket-container">
                <div class="ticket-header">
                    <h1>${eventTitle}</h1>
                    <p>Admit One</p>
                </div>
                
                <div class="ticket-body">
                    <div class="ticket-info">
                        <div class="attendee-name">${attendeeName}</div>
                        
                        <div class="event-details">
                            <div class="detail-item">
                                <div class="detail-icon">📅</div>
                                <div class="detail-content">
                                    <p class="detail-label">Date</p>
                                    <p class="detail-text">${formattedDate}</p>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <div class="detail-icon">🕐</div>
                                <div class="detail-content">
                                    <p class="detail-label">Time</p>
                                    <p class="detail-text">${eventTime || 'TBA'}</p>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <div class="detail-icon">📍</div>
                                <div class="detail-content">
                                    <p class="detail-label">Location</p>
                                    <p class="detail-text">${eventLocation || 'See confirmation email'}</p>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <div class="detail-icon">📞</div>
                                <div class="detail-content">
                                    <p class="detail-label">Contact</p>
                                    <p class="detail-text">${phone || email}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="info-section">
                            <div class="info-label">Ticket ID</div>
                            <div class="info-value" style="font-family: 'Courier New', monospace; letter-spacing: 2px;">
                                ${ticketId}
                            </div>
                        </div>
                    </div>
                    
                    <div class="ticket-qr">
                        <div class="qr-code-wrapper">
                            <img src="${qrCodeBase64}" alt="Event Ticket QR Code" />
                        </div>
                        <div style="text-align: center; font-size: 12px; color: #6c757d; margin-top: 10px;">
                            <strong>Scan this code at check-in</strong>
                        </div>
                    </div>
                </div>
                
                <div class="ticket-footer">
                    <div class="ticket-id">
                        <div class="ticket-id-label">Your Ticket</div>
                        <div class="ticket-id-value">${ticketId}</div>
                    </div>
                    <div class="ticket-instructions">
                        Save this ticket for check-in. Screenshot or print recommended.
                    </div>
                </div>
            </div>
            
            <div class="footer-text">
                <p><strong>Need help?</strong> Visit our website or reply to this email.</p>
                <p style="margin-top: 15px; font-size: 12px;">
                    © EventFlow ${new Date().getFullYear()} | All rights reserved
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

export const generateTicketEmailHTML = (ticketData) => {
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

  // Format date and time
  const dateObj = new Date(eventDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${eventColor} 0%, ${eventColor}dd 100%); color: white; padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">${eventTitle}</h1>
                            <p style="margin: 0; font-size: 14px; opacity: 0.95;">Admit One</p>
                        </td>
                    </tr>
                    
                    <!-- Message -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0 0 15px 0; font-size: 16px; color: #212529;">
                                <strong>Welcome, ${attendeeName}! 🎉</strong>
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #6c757d; line-height: 1.6;">
                                Your registration for <strong>${eventTitle}</strong> is confirmed! Your ticket details are below.
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #6c757d; line-height: 1.6;">
                                <strong>💡 Tip:</strong> Screenshot or save this email. You'll need to scan the QR code at check-in.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Ticket Details -->
                    <tr>
                        <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${eventColor};">${attendeeName}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0; border-top: 1px solid #e9ecef; border-bottom: 1px solid #e9ecef;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px; font-weight: 600;">📅 Date</p>
                                                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #212529; font-weight: 500;">${formattedDate}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px; font-weight: 600;">🕐 Time</p>
                                                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #212529; font-weight: 500;">${eventTime || 'TBA'}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px; font-weight: 600;">📍 Location</p>
                                                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #212529; font-weight: 500;">${eventLocation || 'Check event details'}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0;">
                                                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px; font-weight: 600;">📞 Your Contact</p>
                                                    <p style="margin: 4px 0 0 0; font-size: 15px; color: #212529; font-weight: 500;">${phone || email}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0;">
                                        <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px; font-weight: 600;">Ticket ID</p>
                                        <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: ${eventColor}; font-family: 'Courier New', monospace; letter-spacing: 2px;">${ticketId}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- QR Code -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: white;">
                            <p style="margin: 0 0 15px 0; font-size: 13px; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px; font-weight: 600;">Your Check-In Code</p>
                            <img src="${qrCodeBase64}" alt="QR Code" style="max-width: 220px; height: auto; display: inline-block; border: 2px solid #e9ecef; padding: 15px; border-radius: 8px; background-color: #f8f9fa;" />
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: #6c757d;">Scan this code at check-in</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 30px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
                            <p style="margin: 0 0 15px 0; font-size: 13px; color: #6c757d; line-height: 1.6;">
                                <strong>Important:</strong> Arrive early and have this email handy. Your ticket is non-transferable.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                © EventFlow ${new Date().getFullYear()} | All rights reserved
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
