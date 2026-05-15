# Certificate Template Editor - Complete Testing Guide

## Setup Requirements

Before testing, ensure:
1. MongoDB is running on `localhost:27017`
2. Backend server is running on `localhost:5000`
3. Frontend is running (Vite dev server)
4. You are logged in as an organizer

## Step-by-Step Test Workflow

### STEP 1: Start the Test

```bash
# Terminal 1 - Start MongoDB
mongod --dbpath=/tmp/mongodb

# Terminal 2 - Start Backend
cd /workspaces/eventflow/backend
npm install  # if needed
npm start

# Terminal 3 - Start Frontend  
cd /workspaces/eventflow/frontend
npm install  # if needed
npm run dev
```

### STEP 2: Create Test Event

1. Login to the application
2. Go to "Create Event" or find your dashboard
3. Create an event (or use existing one)
4. Add at least 2 test registrations to the event
5. Note the event ID for reference

### STEP 3: Test Template Selection Flow

#### Test 3A: Select From Gallery
1. Navigate to Certificate Generator
2. Select Event → Click Next
3. Select Recipients → Select at least 1 registration → Click Next
4. You should see "Choose Your Certificate Design"
5. Click on "Blue Gold Appreciation" template card
6. Verify:
   - [ ] Template card shows selected state (blue border)
   - [ ] Template preview is accurate
   - [ ] "Start Editing" button appears at bottom right
7. Click "Start Editing" button
8. Verify:
   - [ ] Editor opens with template preview
   - [ ] Template name input shows "Blue Gold Appreciation"
   - [ ] Canvas shows the certificate template
   - [ ] Element selection buttons show all 5 elements (Title, Subtitle, Recipient, Description, Footer)
   - [ ] Font family dropdown visible
   - [ ] Font size slider visible
   - [ ] Color picker visible
   - [ ] Zoom controls visible in toolbar

#### Test 3B: Start From Scratch
1. Go back to Template Selection (click "Back")
2. Click on "Start from Scratch" / "Create Custom Design"
3. Verify:
   - [ ] Editor opens with blank custom template
   - [ ] Template name input shows "Custom Certificate"
   - [ ] Canvas shows default white certificate with blue text

### STEP 4: Test Editor Functionality

#### Test 4A: Edit Title
1. In the editor, click "Title" button in element selection
2. In the text area, change text to: "Award of Excellence"
3. Verify:
   - [ ] Text changes in canvas preview immediately
   - [ ] Title element is highlighted with blue ring

#### Test 4B: Change Font Size
1. With Title still selected
2. Move the "Font Size" slider to 60
3. Verify:
   - [ ] Slider shows "60px"
   - [ ] Title in canvas gets larger

#### Test 4C: Change Color
1. Click the color picker input
2. Choose a new color (e.g., #FF6B6B)
3. Verify:
   - [ ] Title color changes in canvas
   - [ ] Color input shows new hex value

#### Test 4D: Change Font Family
1. In the "Font Family" dropdown, select "Great Vibes"
2. Verify:
   - [ ] Title font changes to cursive style in preview

#### Test 4E: Edit Recipient Name
1. Click "Recipient Name" button
2. Change text to your name
3. Verify:
   - [ ] Large name in center of certificate updates
   - [ ] Color is gold/accent color

#### Test 4F: Change Canvas Background
1. Click "Title" button again
2. Scroll down to see "Canvas Background" section
3. Click color picker and choose a light color (e.g., #F5F5F5)
4. Verify:
   - [ ] Certificate background color changes
   - [ ] Border and decorations remain visible

#### Test 4G: Zoom Controls
1. Click zoom out button (-) several times
2. Verify:
   - [ ] Certificate shrinks in canvas
   - [ ] Percentage shows decreasing (90%, 80%, 70%)
3. Click zoom in button (+)
4. Verify:
   - [ ] Certificate grows back
5. Click reset button (circular arrow)
6. Verify:
   - [ ] Zoom returns to 100%

#### Test 4H: Reset Template
1. Make several edits (change title, color, etc.)
2. Click "Reset to Template" button
3. Verify:
   - [ ] All changes revert to original template
   - [ ] No confirmation dialog (direct reset)

### STEP 5: Test Save Template

#### Test 5A: Save with Valid Data
1. Make sure "Template Name" field has a value (e.g., "My Custom Gold Certificate")
2. Edit at least one element to ensure changes are saved
3. Click "Save Template" button
4. Verify:
   - [ ] Button shows "Saving..." with spinner
   - [ ] No error toast appears
   - [ ] Page transitions to Step 5 (Send Certificates)
5. Check browser console - should see:
   ```
   Saving template: {templateName: "My Custom Gold Certificate", ...}
   Template saved successfully: [template_id]
   ```

#### Test 5B: Save Without Template Name
1. Clear the template name field
2. Click "Save Template"
3. Verify:
   - [ ] Error toast appears: "Please enter a template name"
   - [ ] Page does NOT proceed to next step

#### Test 5C: Network Error Handling
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Save Template"
4. In DevTools, right-click the POST request and "Block request URL"
5. Verify:
   - [ ] Error toast appears with message about save failure
   - [ ] Page does NOT proceed to next step
6. Unblock the URL for next tests

### STEP 6: Test Multi-Element Editing

1. Go through and edit each element:
   - Title: Change heading text and color
   - Subtitle: Change subtitle text
   - Recipient Name: Change size and font
   - Description: Change description text and color
   - Footer: Change footer text

2. For each element, verify:
   - [ ] Element is highlighted when selected
   - [ ] Text area shows current value
   - [ ] Font size slider updates
   - [ ] Color picker shows current color
   - [ ] Canvas preview updates in real-time

### STEP 7: Test Navigation

1. In editor, click "Back" button
2. Verify:
   - [ ] Returns to Template Selection
   - [ ] Template selection is reset

3. Click "Start Editing" again on same template
4. Verify:
   - [ ] Editor opens fresh (not showing your edits)
   - [ ] This is expected behavior - template saved, not auto-loading edits

### STEP 8: Verify Database

Open MongoDB client (mongosh) and verify:

```javascript
use certificate_db
db.certificatetemplates.find({templateName: "My Custom Gold Certificate"}).pretty()
```

Should show saved template with:
- `templateName`: Your template name
- `organizerId`: Your user ID
- `eventId`: Your event ID
- `heading`: Your edited heading
- `headingColor`: Your chosen color
- All other fields

## Expected Results Summary

✅ **All tests should pass with these results:**

| Test | Expected Result | Pass |
|------|-----------------|------|
| Template Selection | Template loads in editor | ✓ |
| Element Selection | All 5 elements selectable | ✓ |
| Text Editing | Text updates in preview | ✓ |
| Font Size Change | Slider updates preview | ✓ |
| Color Picker | Color changes preview | ✓ |
| Font Family | Font style changes | ✓ |
| Canvas Background | Background color changes | ✓ |
| Zoom Controls | Canvas scales properly | ✓ |
| Reset Template | Reverts all changes | ✓ |
| Save Valid | Saves to DB, proceeds | ✓ |
| Save Invalid | Shows error, doesn't proceed | ✓ |
| Navigation | Back button works | ✓ |
| Database | Template saved correctly | ✓ |

## Troubleshooting

### Error: "Cannot find package 'express'"
```bash
cd /workspaces/eventflow/backend
npm install
```

### Error: "MongoDB connection refused"
```bash
mongod --dbpath=/tmp/mongodb &
# Wait 2-3 seconds for startup
```

### Error: "POST /api/certificates/template/create 400"
Check console output - should show specific field error (templateName, organizerId, etc.)

### Template doesn't save but no error shown
Check:
1. Browser DevTools console for errors
2. Backend terminal for error messages
3. Network tab to see actual error response

### Canvas shows blank/no decorations
This is normal - decorations load from prebuilt templates. Custom templates show plain certificate.

## Success Criteria

You have successfully fixed the editor when:

1. ✅ Can select template → editor opens properly
2. ✅ Can start from scratch → custom editor opens
3. ✅ Can edit all text elements
4. ✅ Can change font sizes
5. ✅ Can change colors
6. ✅ Can change font families
7. ✅ Can save template with valid name
8. ✅ Gets validation error with invalid name
9. ✅ Template appears in database
10. ✅ No validation errors on save

## Notes

- All changes in the editor are NOT auto-saved
- Only clicking "Save Template" persists to database
- Closing editor without saving loses all changes
- Template name is required - must be non-empty string
- OrganizerId is auto-extracted from JWT token
- EventId must match the selected event

---

**Last Updated**: May 15, 2026
**Status**: Complete and Ready for Testing
