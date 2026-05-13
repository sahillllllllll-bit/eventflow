# Certificate Generation Feature - Complete Guide

## Overview

The Certificate Generation feature allows event organizers to create, customize, and distribute professional certificates to event attendees. The feature includes:

- **Beautiful certificate design** with customizable colors, logos, fonts, and layouts
- **Smart pricing model**: 20 free certificates per month, then ₹1 per certificate
- **Two distribution methods**: Download as PDF or send via email
- **Live preview** while designing certificates
- **Multiple design templates** (landscape/portrait orientation)
- **Professional borders and styling options**

## Feature Flow

### Step 1: Select Event
- Navigate to **Dashboard → Certificates**
- Choose an event you created
- See the number of registrations for each event

### Step 2: Select Recipients
- View all attendees registered for the selected event
- Select individual attendees or "Select All"
- Selected count is displayed

### Step 3: Design Certificate
Customize the following elements:

#### Design Elements
- **Template Layout**: Portrait or Landscape
- **Background Color**: Choose any color
- **Border Style**: None, Simple, Elegant, or Modern
- **Border Color**: Custom color for borders

#### Logo Section
- Upload organization/event logo
- Adjust logo width and height (in pixels)

#### Main Heading
- Text: "Certificate of Completion" (editable)
- Font Size: Adjustable
- Color: Custom color

#### Sub Heading
- Default: "This is to certify that"
- Editable text and font size

#### Recipient Name
- Automatically populated from registration
- Font size and color customizable
- Appears underlined

#### Description Section
- Text: "Has successfully completed the event"
- Font size and color customizable

#### Footer Section
- Text: "Issued on {date}" (supports placeholders)
- Font size and color customizable
- Automatically populates with current date

#### Organizer Details
- Organizer Name: Your name/organization
- Organizer Signature: Upload signature image
- Appears at bottom with signature line

### Step 4: Review & Pricing
- See pricing breakdown:
  - Free certificates available this month
  - Number of paid certificates needed
  - Total cost (₹1 per paid certificate)

### Step 5: Generate & Distribute

Two options available:

#### Option 1: Download All as PDF
- Generates certificates for all selected attendees
- Download individual PDFs
- Manual distribution to attendees

#### Option 2: Auto-Send via Email
- Generates certificates
- Automatically sends to attendees with downloadable link
- Includes certificate ID and unique code
- Tracking: Email sent/failed status

## Technical Details

### Database Models

#### CertificateTemplate
Stores certificate design templates with:
- Event and organizer references
- Design settings (colors, fonts, sizing)
- Content templates (text, placeholders)
- Logo and signature URLs
- Border and layout preferences

#### CertificateIssued
Tracks issued certificates:
- Template reference
- Recipient information
- Unique certificate code
- Email delivery status
- Download tracking
- Certificate snapshot (design at time of issue)

#### CertificatePricing
Tracks organizer's certificate quota:
- Free certificates remaining (20/month)
- Total paid certificates
- Monthly usage statistics

### API Endpoints

#### Event Endpoints
- `GET /api/certificates/organizer/events` - List organizer's events
- `GET /api/certificates/event/:eventId/registrations` - Get registrations for event

#### Template Endpoints
- `POST /api/certificates/template/create` - Create certificate template
- `GET /api/certificates/template/:templateId` - Get template details
- `PUT /api/certificates/template/:templateId` - Update template
- `DELETE /api/certificates/template/:templateId` - Delete template
- `GET /api/certificates/organizer/templates` - List all templates

#### Generation & Distribution
- `POST /api/certificates/preview` - Generate HTML preview
- `POST /api/certificates/check-pricing` - Check certificate pricing
- `POST /api/certificates/generate` - Generate certificates for attendees
- `GET /api/certificates/issued/:templateId` - List issued certificates

#### Download & Email
- `GET /api/certificates/download/:certificateId` - Download certificate PDF
- `POST /api/certificates/send-emails` - Send certificates via email

#### Pricing
- `GET /api/certificates/pricing/info` - Get organizer's pricing info

## Frontend Components

### CertificatePage.jsx
Main page component managing the 4-step wizard:
1. Event selection
2. Recipient selection
3. Certificate design (via CertificateEditor)
4. Generation and distribution

### CertificateEditor.jsx
Certificate customization panel with:
- Two-column layout (editor + live preview)
- Color pickers for all elements
- Font size adjusters
- Image upload (logo, signature)
- Template layout selection
- Real-time preview

### CertificatePreview.jsx
Live preview component showing:
- Responsive certificate rendering
- All customizations applied
- Professional certificate layout
- Sample recipient name and event name

## Usage Examples

### Basic Certificate Workflow

```bash
# 1. Start certificate generator from dashboard
Navigate to: /dashboard/certificates

# 2. Select event with registrations
Click on event from list

# 3. Select recipients
Click "Select All" or individual attendees

# 4. Design certificate
Customize colors, text, logo, etc.
Use preview panel for real-time feedback

# 5. Generate & distribute
Choose: Download or Auto-Send
```

### Customization Examples

#### Formal Corporate Certificate
- Landscape orientation
- Professional colors (Navy blue, white)
- Elegant border
- Company logo
- Executive signature

#### Educational Certificate
- Portrait orientation
- University colors (accent)
- Modern border
- School logo
- Principal's signature

#### Event Participation Certificate
- Landscape orientation
- Event brand colors
- Simple border
- Event logo
- Organizer name

## Features Implementation

### Design Features (✅ Complete)
- Multi-element customization
- Live preview
- Color pickers
- Font size adjusters
- Image uploads (logo, signature)
- Multiple border styles
- Layout options (portrait/landscape)

### Distribution Features (✅ Complete)
- Batch certificate generation
- PDF download support
- Email delivery with downloadable link
- Unique certificate codes
- Recipient tracking

### Pricing Features (✅ Complete)
- Free quota system (20/month)
- Paid certificate calculation (₹1 each)
- Usage tracking
- Pricing display before generation
- **Note**: Payment gateway integration not implemented (ready for future integration)

### Database Features (✅ Complete)
- Template storage and retrieval
- Certificate issuance tracking
- Email status tracking
- Download count tracking
- Pricing quotas

## Future Enhancements

### Phase 2: Payment Integration
- Razorpay integration for payment
- "Pay Now" button activation
- Automatic quota update after payment
- Payment history and invoices

### Phase 3: Advanced Features
- Certificate templates library
- Bulk template import
- Certificate verification system
- QR codes on certificates
- Digital certificate storage
- Certificate sharing to LinkedIn

### Phase 4: Analytics
- Certificate download analytics
- Email open rates
- Recipient engagement tracking
- Distribution reports

## Testing the Feature

### 1. Without Payment (Current)
The feature works fully without payment:
- Free certificates generated without payment
- All pricing shows as ₹0 if within quota
- Email sending works
- Download functionality works

### 2. Testing Workflow
```
1. Create an event
2. Register test attendees
3. Go to Dashboard → Certificates
4. Select event and registrants
5. Design a test certificate
6. Generate and download
7. Check generated PDF
```

### 3. Email Testing
To test email sending:
- Use test email addresses
- Check spam folder for emails
- Verify email contains downloadable link
- Check unique certificate code

## Troubleshooting

### Issue: "No events found"
- Create an event first
- Ensure event is created by logged-in user
- Event must have registrations

### Issue: "No registrations showing"
- Add registrations to the event
- Use PublicEventPage to register test attendees
- Ensure event is published

### Issue: "Preview not showing"
- Check browser console for errors
- Ensure all required fields are filled
- Try different color values

### Issue: "Emails not sending"
- Check email configuration in backend
- Verify SendGrid/email service setup
- Check console for email service errors

## Code Structure

```
Backend:
├── models/
│   └── Certificate.js (CertificateTemplate, CertificateIssued, CertificatePricing)
├── services/
│   └── certificateService.js (Business logic)
├── controllers/
│   └── certificateController.js (API handlers)
└── routes/
    └── certificateRoutes.js (API endpoints)

Frontend:
├── pages/
│   └── CertificatePage.jsx (Main wizard)
├── components/
│   ├── CertificateEditor.jsx (Design panel)
│   └── CertificatePreview.jsx (Live preview)
└── api/
    └── endpoints.js (Certificate API calls)
```

## Configuration

### Environment Variables
No additional environment variables needed for basic functionality.

For email delivery:
- `SENDGRID_API_KEY` - Already configured
- `FRONTEND_URL` - Used for email links

## Performance Notes

- Certificate generation uses unique UUIDs for security
- Templates are cached in database for quick access
- PDF generation is client-side (using jsPDF + html2canvas)
- Email sending is asynchronous (non-blocking)

## Security

- All certificate endpoints require authentication
- Organizers can only access their own templates
- Unique certificate codes prevent fraud
- Email verification for test accounts recommended

## Next Steps

1. **Test the feature** with sample events and registrations
2. **Customize branding** to match your platform
3. **Set up email testing** with test accounts
4. **Plan payment integration** for Phase 2
5. **Gather user feedback** for improvements

---

**Feature Status**: ✅ Fully Functional (Production Ready without Payment)

**Last Updated**: December 2024
