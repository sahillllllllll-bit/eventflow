# Certificate Feature - Testing Guide

## 🧪 Complete Testing Guide

This guide will walk you through testing all features of the Certificate Generation system.

---

## Prerequisites

- [ ] Backend running: `npm run dev` (from `/backend`)
- [ ] Frontend running: `npm run dev` (from `/frontend`)
- [ ] MongoDB running
- [ ] Logged in as organizer user
- [ ] At least one published event with registrations

---

## Part 1: Setup Test Data (5 minutes)

### 1.1 Create a Test Event

1. Navigate to **Dashboard → Events**
2. Click **"Create Event"**
3. Fill in details:
   - Name: "Test Conference 2024"
   - Description: "A test event for certificate generation"
   - Start Date: (any future date)
   - End Date: (later date)
   - Ticket Price: 0 (free or paid)
4. Click **"Create Event"**
5. **Publish** the event

### 1.2 Add Test Registrations

1. Navigate to the **public event page** (Share link)
2. Register 3-5 test attendees:
   - Names: John Doe, Jane Smith, Alex Johnson, etc.
   - Emails: test1@example.com, test2@example.com, etc.
   - Fill other fields as needed
3. Submit each registration

### 1.3 Verify Registrations

1. Go back to Dashboard
2. Navigate to **Events → Event Details**
3. Verify you see the registrations you just added
4. Count should match (e.g., 3 registrations)

---

## Part 2: Certificate Feature Tests

### Test 2.1: Navigation & Access

**Test**: Can organizer access the certificate feature?

1. Click **"Certificates"** in the left sidebar
2. ✅ Should navigate to `/dashboard/certificates`
3. ✅ Should see "Certificate Generator" title
4. ✅ Should see step indicator (1-4)
5. ✅ Should see list of events

### Test 2.2: Event Selection

**Test**: Can organizer select an event?

1. From certificate page, view list of events
2. ✅ Should show event name, image, description
3. ✅ Should show registration count
4. Click on the test event you created
5. ✅ Should navigate to Step 2 (Select Recipients)
6. ✅ Should load registrations from database

### Test 2.3: Recipient Selection

**Test**: Can organizer select recipients?

1. On recipient selection page:
2. ✅ Should show all registrations from event
3. ✅ Each registration should have checkbox
4. ✅ Should show recipient name and email
5. Test "Select All":
   - Click **"Select All"** button
   - ✅ All checkboxes should be checked
   - ✅ Count should show total registrations
6. Test individual selection:
   - Click **"Select All"** again to uncheck
   - ✅ All should uncheck
   - Click 2-3 individual checkboxes
   - ✅ Only selected ones should be checked

### Test 2.4: Certificate Editor

**Test**: Can organizer design certificate?

1. Select 2-3 recipients and click **"Continue"**
2. ✅ Should navigate to Step 3 (Design)
3. ✅ Should show two panels: Editor (left) + Preview (right)
4. ✅ Should show certificate preview on right

#### Sub-test: Color Customization

1. Find **"Background Color"** in editor
2. ✅ Should show color picker + hex input
3. Click color picker, select **blue**
4. ✅ Certificate background should turn blue
5. ✅ Hex input should update
6. Type hex code: `#ff0000` (red)
7. ✅ Should update to red in real-time
8. Repeat for **Accent Color** and **Border Color**

#### Sub-test: Text Customization

1. Find **"Main Heading"** section
2. Change heading text from "Certificate of Completion" to **"Achievement Certificate"**
3. ✅ Preview should update immediately
4. Adjust **"Heading Font Size"** slider
5. ✅ Text size should change in preview
6. Change **"Heading Color"** to a contrasting color
7. ✅ Text color should update
8. Repeat for Sub Heading, Description, Footer

#### Sub-test: Logo Upload

1. Find **"Logo"** section
2. Click **"Upload Logo"** button
3. Select any image file (PNG/JPG)
4. ✅ Preview should show logo at top
5. Adjust **"Logo Width"** to 80px
6. ✅ Logo should resize
7. Adjust **"Logo Height"** to 60px
8. ✅ Logo should resize accordingly

#### Sub-test: Layout Options

1. Find **"Certificate Layout"** dropdown
2. Select **"Portrait"**
3. ✅ Preview should switch to portrait orientation
4. ✅ Certificate should be taller than wide
5. Select **"Landscape"** again
6. ✅ Certificate should return to landscape

#### Sub-test: Border Styles

1. Find **"Border Style"** dropdown
2. Select **"Simple"**
3. ✅ Preview should show simple border
4. Select **"Elegant"**
5. ✅ Preview should show elegant double border
6. Select **"Modern"**
7. ✅ Preview should show top/bottom borders only
8. Select **"None"**
9. ✅ Preview should have no border

#### Sub-test: Preview Button

1. Click **"Preview"** button at top right
2. ✅ Should show full-screen preview
3. ✅ Should hide editor
4. Click **"Back to Editor"**
5. ✅ Should return to editor view

### Test 2.5: Template Saving

**Test**: Is template saved before generation?

1. Make custom design changes
2. Click **"Save & Continue"** button
3. ⏳ Should show loading spinner
4. ✅ Should navigate to Step 4 (Send)
5. ✅ Should display pricing information

### Test 2.6: Pricing Display

**Test**: Is pricing calculated correctly?

1. On Step 4 page:
2. ✅ Should show event name and recipient count
3. ✅ Should show "Pricing Information" section
4. Verify display includes:
   - ✅ Free certificates available
   - ✅ Paid certificates needed (should be 0 for first 20)
   - ✅ Total cost (should be ₹0 for less than 20)
5. Note the pricing message

### Test 2.7: Certificate Generation - Download Option

**Test**: Can organizer download all certificates?

1. On Step 4, click **"Download All Certificates"**
2. ⏳ Should show loading spinner
3. ⏳ Should say "Generating..."
4. ✅ Should display success message
5. ✅ Should show generated certificates list
6. Each certificate should show:
   - ✅ Recipient name
   - ✅ Recipient email
   - ✅ Email status (pending)

### Test 2.8: PDF Download

**Test**: Can organizer download individual PDFs?

1. After generation, click **"Download All as PDF"**
2. ⏳ Should show loading spinner
3. ✅ Browser should open print dialog (or download)
4. ✅ Should show certificate preview
5. ✅ Should include:
   - ✅ Recipient name (bold, underlined)
   - ✅ All customized text
   - ✅ Colors applied correctly
   - ✅ Logo displayed (if uploaded)
   - ✅ Unique certificate code (bottom right)
   - ✅ Current date
   - ✅ Professional appearance
6. Print to PDF or close dialog

### Test 2.9: Certificate Generation - Email Option

**Test**: Can organizer auto-send certificates?

1. Go back and create new certificates
2. On Step 4, click **"Auto-Send via Email"**
3. ⏳ Should show loading spinner
4. ✅ Should generate certificates
5. ✅ Should show success message about emails sent
6. ✅ Email status should update to "sent"

### Test 2.10: Email Delivery (if email configured)

**Test**: Do recipients receive emails?

1. **For test emails**: Check spam folder
2. ✅ Should receive email for each recipient
3. Email should contain:
   - ✅ Subject with event name
   - ✅ Personalized greeting with recipient name
   - ✅ Congratulations message
   - ✅ "Download Certificate" link
   - ✅ Organizer signature

### Test 2.11: Certificate Code Uniqueness

**Test**: Does each certificate get unique code?

1. Generate certificates for 3 recipients
2. Download each PDF
3. ✅ Each should have different "Cert ID" at bottom right
4. ✅ Codes should be 12-character alphanumeric
5. ✅ No two should be identical

---

## Part 3: Edge Cases & Error Handling

### Test 3.1: No Registrations Selected

1. On Step 2, don't select any recipients
2. Click **"Continue"**
3. ✅ Should show warning: "Please select at least one registration"
4. ✅ Should not proceed to Step 3

### Test 3.2: No Events Found

1. Create new user account (if possible)
2. Navigate to Certificates
3. ✅ Should show "No Events Found" message
4. ✅ Should guide to create event first

### Test 3.3: Invalid Template Data

1. Edit design with empty heading
2. Try to save
3. ✅ Should handle gracefully or show validation error

### Test 3.4: Large Batch Generation

1. Select many registrations (10+ if available)
2. Generate certificates
3. ✅ Should handle batch processing
4. ✅ Should complete without timeout

### Test 3.5: Back Button Navigation

1. During Step 2, click **"Back"**
2. ✅ Should return to Step 1
3. ✅ Event selection should reset
4. From Step 3, click **"Back"**
5. ✅ Should return to Step 2
6. ✅ Selected recipients should clear

---

## Part 4: Data Integrity Tests

### Test 4.1: Template Persistence

1. Create and save a certificate template
2. Refresh the page
3. ✅ Template design should be preserved
4. ✅ Can view previously created templates

### Test 4.2: Certificate Tracking

1. Generate certificates
2. Check certificate list shows all generated
3. ✅ Each should have unique ID
4. ✅ Email status should be visible
5. ✅ Recipient info should be correct

### Test 4.3: Organizer Isolation

1. Create account #2 (if possible)
2. Login with account #2
3. ✅ Should NOT see account #1's events
4. ✅ Should NOT see account #1's certificates

---

## Part 5: UI/UX Tests

### Test 5.1: Responsive Design

1. Test on different screen sizes:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x812)
2. ✅ Editor and preview should be responsive
3. ✅ Forms should be usable on all sizes
4. ✅ No horizontal scrolling needed

### Test 5.2: Loading States

1. During certificate generation:
2. ✅ Should show loading spinner
3. ✅ Buttons should be disabled
4. ✅ Should show progress/status

### Test 5.3: Error Messages

1. Test various error scenarios:
   - Invalid file upload
   - Network timeout
   - Server errors
2. ✅ Should show clear error messages
3. ✅ Should suggest corrective actions

### Test 5.4: Color Contrast

1. Generate certificate with various color combos
2. ✅ Text should be readable
3. ✅ Colors should have good contrast
4. ✅ Print-friendly (blacks, whites, gray)

---

## Part 6: Browser Compatibility

Test on multiple browsers:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if Mac available)
- [ ] Edge

For each browser:
- [ ] Navigation works
- [ ] Forms display correctly
- [ ] Colors render properly
- [ ] PDF generation works
- [ ] Email sending works (if tested)

---

## Part 7: Performance Tests

### Test 7.1: Large File Upload

1. Try uploading large logo (5MB+)
2. ✅ Should handle gracefully
3. ✅ Should show file size warning if needed

### Test 7.2: Batch Generation Performance

1. Generate 50+ certificates
2. ✅ Should complete in reasonable time (<30 sec)
3. ✅ Should not freeze UI
4. ✅ Should show progress

### Test 7.3: Database Queries

1. Monitor backend logs
2. ✅ Queries should be efficient
3. ✅ No N+1 query problems
4. ✅ Proper indexing working

---

## Part 8: Security Tests

### Test 8.1: Authentication

1. Try accessing certificates while logged out
2. ✅ Should redirect to login

### Test 8.2: Authorization

1. Try accessing other organizer's certificates (if possible)
2. ✅ Should return 403 Forbidden
3. ✅ Should not expose other's data

### Test 8.3: Input Validation

1. Try injecting script tags in text fields
2. ✅ Should sanitize input
3. ✅ Should not execute scripts

---

## Test Results Template

```
Test Date: _______________
Tester: ___________________
Browser: __________________
Device: ___________________

RESULTS:
┌─────────────────────────────┬────────┬────────────────────┐
│ Test Case                   │ Status │ Notes              │
├─────────────────────────────┼────────┼────────────────────┤
│ 2.1: Navigation             │ ✅/❌  │ [Notes]            │
│ 2.2: Event Selection        │ ✅/❌  │ [Notes]            │
│ 2.3: Recipient Selection    │ ✅/❌  │ [Notes]            │
│ 2.4: Certificate Editor     │ ✅/❌  │ [Notes]            │
│ 2.5: Template Saving        │ ✅/❌  │ [Notes]            │
│ 2.6: Pricing Display        │ ✅/❌  │ [Notes]            │
│ 2.7: PDF Generation         │ ✅/❌  │ [Notes]            │
│ 2.8: Certificate Download   │ ✅/❌  │ [Notes]            │
│ 2.9: Email Auto-Send        │ ✅/❌  │ [Notes]            │
│ 3.1: Error Handling         │ ✅/❌  │ [Notes]            │
│ 4.1: Data Integrity         │ ✅/❌  │ [Notes]            │
│ 5.1: UI/UX                  │ ✅/❌  │ [Notes]            │
└─────────────────────────────┴────────┴────────────────────┘

Overall Status: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

Issues Found:
1. [Issue description]
2. [Issue description]
3. [Issue description]

Recommendations:
1. [Recommendation]
2. [Recommendation]
```

---

## Troubleshooting During Testing

### Problem: "Template not found" error
- **Cause**: Template ID mismatch or database issue
- **Fix**: Check MongoDB connection, restart backend

### Problem: Certificate preview not updating
- **Cause**: State management issue
- **Fix**: Refresh page, check browser console

### Problem: PDF download not working
- **Cause**: Browser popup blocker or jsPDF issue
- **Fix**: Allow popups, check console errors

### Problem: Email not sending
- **Cause**: Email service not configured
- **Fix**: Check backend email configuration

### Problem: Registrations not loading
- **Cause**: API endpoint issue or data mismatch
- **Fix**: Check network tab, verify event has registrations

---

## Sign-Off

All tests completed: ___________
Approved for production: ___________
Date: ___________

---

**Happy Testing! 🧪**
