# Certificate Feature - Quick Start Guide

## 🎯 Quick Setup (5 minutes)

### Prerequisites
- Application running (backend + frontend)
- User logged in as organizer
- At least one published event with registrations

### Step 1: Access Certificate Generator
1. Click **"Certificates"** in the left sidebar (under Dashboard)
2. You'll see all your events listed

### Step 2: Select Event & Recipients
1. Click on any event to see registrations
2. Click **"Select All"** to choose all attendees, or select individually
3. Click **"Continue"** button

### Step 3: Design Your Certificate (5 minutes max!)
**Quick Customization:**
- Change **"Heading"** to your event title
- Pick a **"Background Color"** (try #f0f9ff for light blue)
- Set **"Accent Color"** to your brand color (try #3b82f6)
- Add your **logo** (optional)
- Set **"Organizer Name"** to your name/company
- Click **"Preview"** to see live changes

**That's it!** The certificate preview will show all your customizations in real-time.

### Step 4: Generate & Share
Two options:

#### Option A: Download All
- Click **"Download All Certificates"**
- Certificates are generated with unique codes
- Each attendee gets a unique certificate

#### Option B: Auto-Send via Email
- Click **"Auto-Send via Email"**
- Certificates are sent directly to attendees
- Each email contains a downloadable link

## 📊 Pricing (No Payment Yet!)

Currently **FREE for all** while feature is in beta:
- Organizers can generate unlimited certificates
- No payment required
- Full functionality enabled

**Future**: Will be 20 free/month + ₹1 per additional certificate

## 🎨 Design Tips

### Professional Look
```
Background: White (#ffffff)
Accent: Navy (#1e3a8a)
Border: Elegant
Font: Georgia, serif
```

### Modern Look
```
Background: Light Blue (#f0f9ff)
Accent: Blue (#3b82f6)
Border: Modern
Font: Adjustable sizes
```

### Minimalist Look
```
Background: White (#ffffff)
Accent: Black (#000000)
Border: Simple
Font: Consistent sizing
```

## 🧪 Testing Features

### Test 1: Basic Certificate
1. Create simple certificate with default settings
2. Download one PDF to check output
3. Verify recipient name appears correctly

### Test 2: Customization
1. Upload a logo
2. Change all colors
3. Adjust all font sizes
4. Preview to verify
5. Download and check PDF

### Test 3: Bulk Generation
1. Select all recipients
2. Generate certificates
3. Verify each has unique code
4. Download all

### Test 4: Email Sending
1. Generate with "Auto-Send"
2. Check test email inbox
3. Verify email contains link
4. Click link to download certificate

## ✅ Verification Checklist

- [ ] Can access Certificates from sidebar
- [ ] Can see list of events with registration count
- [ ] Can select registrations (individual + select all)
- [ ] Design editor loads with preview
- [ ] Can change colors with color picker
- [ ] Can upload logo image
- [ ] Preview updates in real-time
- [ ] Can download certificate as PDF
- [ ] PDF shows recipient name correctly
- [ ] PDF shows unique certificate code
- [ ] Can generate multiple certificates
- [ ] Each certificate has unique code

## 🐛 Common Issues & Fixes

### "No events showing"
**Fix**: Create an event first from Dashboard → Events

### "No registrations showing"
**Fix**: 
- Add registrations from public event page
- Or manually register attendees
- Event must have at least 1 registration

### "Preview not updating"
**Fix**: 
- Refresh the page
- Try different color values
- Check browser console for errors

### "Download not working"
**Fix**:
- Check browser's download folder
- Try a different browser
- Check popup blocker settings

### "Email not received"
**Fix**:
- Check spam/junk folder
- Verify test email is correct
- Check backend email configuration
- Check application logs

## 📱 Certificate Template Fields

You can customize:

| Field | Options |
|-------|---------|
| Layout | Portrait / Landscape |
| Background | Any color |
| Heading Text | Any text |
| Heading Size | 20-72 px |
| Heading Color | Any color |
| Accent Color | Any color |
| Border Style | None / Simple / Elegant / Modern |
| Logo | Upload image |
| Organizer Name | Your name |
| Signature | Upload signature image |
| Footer Text | Any text (use {date} for auto date) |

## 🚀 Next Steps

1. **Test** with a sample event (2 min)
2. **Design** your first certificate (5 min)
3. **Generate** test certificates (1 min)
4. **Download** and review quality (1 min)
5. **Send** to real attendees when ready (1 min)

## 📞 Support

For issues or feature requests:
1. Check logs: `npm run dev`
2. Verify database connection
3. Check backend is running on correct port
4. Ensure frontend is accessing correct API endpoints

---

**Happy Certificate Generating! 🎓**
