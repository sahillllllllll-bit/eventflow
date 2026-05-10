# EventFlow MVP 🎪

**The Complete Event Management Platform for College Organizers**

EventFlow is a full-stack web application designed to help college event organizers create, manage, and monetize events with ease. From registration management to QR code check-ins, EventFlow handles everything.

---

## ✨ Features Overview

### For Organizers
- 📝 **Event Creation** — Multi-step wizard with 5 customizable templates
- 📊 **Analytics Dashboard** — Real-time metrics (registrations, revenue, check-in rates)
- 👥 **Registration Management** — Searchable attendee lists with CSV export
- 💰 **Payment Processing** — Razorpay integration for paid events
- 📧 **Email Campaigns** — Send promotional emails to past attendees
- 💳 **Payout Tracking** — Monitor earnings and platform fees
- ✅ **Check-in System** — QR code scanning for venue management
- 🎨 **Landing Templates** — 5 professional designs (minimal, bold, gradient, dark, glass)
- ⚡ **Custom Forms** — Drag-drop registration form builder with 12+ field types

### For Attendees
- 🔐 **Easy Registration** — Dynamic forms with custom fields
- 🎫 **Digital Tickets** — Unique QR codes for check-in
- 📱 **Mobile Friendly** — Fully responsive design
- 🔔 **Email Updates** — Event reminders and newsletters

---

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB 7.5.0 (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken 9.0.2, 7-day expiry)
- **Security**: Helmet, CORS, express-mongo-sanitize, xss-clean, rate limiting
- **Email**: SendGrid SMTP via Nodemailer 6.9.7
- **Payments**: Razorpay API
- **QR Codes**: qrcode 1.5.3 (base64 PNG)
- **CSV Export**: csv-writer 1.6.0
- **Validation**: Zod with custom error middleware
- **Password**: bcryptjs 2.4.3 (12 salt rounds)

### Frontend
- **Framework**: React 18.2.0
- **Bundler**: Vite 5.0.4
- **Styling**: TailwindCSS 3.3.5 + forms plugin
- **HTTP**: Axios 1.5.0 with JWT interceptor
- **Routing**: React Router v6.16.0
- **Forms**: react-hook-form 7.47.0 + Zod validation
- **UI**: Lucide React 0.294.0 icons
- **Charts**: Recharts (for analytics)
- **Drag-Drop**: @dnd-kit (form builder)
- **QR Scan**: html5-qrcode 2.3.4
- **State**: React Context (AuthContext)

---

## 📊 Project Status

### ✅ Complete (MVP-Ready)
- Backend: 26 files (controllers, models, middleware, routes, services)
- Frontend: 16 routes with full UI implementation
- Authentication: JWT + protected routes
- Dashboard: Home, events list, event detail page (5 tabs)
- Pages: Landing, login, register, payouts, promo emails, settings
- Components: Sidebar, metrics, status badges, modals, toasts
- API Integration: 25+ endpoint functions organized by feature

### 📋 In-Progress/Planned
- Multi-step event creation wizard
- Form builder with drag-drop
- Razorpay payment flow
- QR code scanner
- Public event landing pages
- Advanced analytics charts

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+
- **MongoDB** (local or Atlas)
- **SendGrid API key** (for emails)
- **Git**

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventflow
JWT_SECRET=generate_a_random_secret_key_here
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=SG.your_api_key
EMAIL_FROM=noreply@eventflow.in
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

Start backend:
```bash
npm run dev    # Runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
```

Ensure `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev    # Runs on http://localhost:5173
```

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.**

---

## 📁 File Structure

```
eventflow/
├── backend/
│   ├── controllers/        (5 files: auth, events, registrations, promo, payouts)
│   ├── middleware/         (4 files: auth, error handler, rate limiter, validate)
│   ├── models/             (4 files: User, Event, Registration, PromoEmail)
│   ├── routes/             (5 files: auth, events, registrations, promo, payouts)
│   ├── services/           (3 files: email, QR code, CSV export)
│   ├── utils/              (helpers.js for token/slug generation)
│   ├── server.js           (Express app setup)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js           (HTTP client config)
│   │   │   └── endpoints.js       (25 API functions)
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── EventCard.jsx
│   │   │   └── Modal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useToast.jsx
│   │   ├── pages/            (16 pages)
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── EventDetailPage.jsx
│   │   │   ├── PayoutsPage.jsx
│   │   │   ├── PromoEmailPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── [+ 7 more scaffolded pages]
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx          (Router with 16 routes)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── SETUP_GUIDE.md           (Detailed setup instructions)
└── README.md                (This file)
```

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `POST /api/auth/forgot-password` — Request reset
- `POST /api/auth/reset-password` — Reset with token
- `POST /api/auth/verify-email` — Verify email

### Events
- `POST /api/events` — Create event
- `GET /api/events/my` — List organizer's events
- `GET /api/events/:slug` — Get event (public)
- `PUT /api/events/:id` — Update event
- `DELETE /api/events/:id` — Delete event
- `POST /api/events/:id/publish` — Publish event
- `GET /api/events/:id/analytics` — Get metrics

### Registrations
- `POST /api/registrations` — Register attendee
- `GET /api/registrations/event/:id` — List registrations
- `PUT /api/registrations/:id/check-in` — Check in
- `GET /api/registrations/event/:id/export` — Export CSV

### Promo Emails
- `POST /api/promo/send` — Send campaign
- `GET /api/promo/history` — List campaigns

### Payouts
- `GET /api/payouts/summary` — Get earnings

---

## 🎨 Design System

- **Primary Color**: #6C47FF (Electric Purple)
- **Background**: #0A0A0F
- **Surface**: #111118, #16161F, #1E1E2E
- **Typography**: Outfit font
- **Mode**: Dark theme with purple accents
- **Responsive**: Mobile-first design

---

## 🔐 Security

- ✅ JWT authentication with 7-day expiry
- ✅ Bcrypt password hashing (12 salt rounds)
- ✅ Rate limiting (10 req/15min auth, 5 req/min registration)
- ✅ CORS enabled for frontend domain only
- ✅ Helmet.js for HTTP security headers
- ✅ MongoDB injection prevention
- ✅ XSS protection
- ✅ Zod validation on all inputs
- ✅ Secure password reset tokens

---

## 📈 Database Schema

### User
```json
{ name, email, password, college, phone, organizerSlug, totalEventsCreated, totalAttendeesReached, isVerified }
```

### Event
```json
{ organizer, title, slug, category, template, date, maxCapacity, currentRegistrations, isPaid, ticketPrice, formSections, status }
```

### Registration
```json
{ event, organizer, ticketId, name, email, phone, responses, qrCode, isPaid, paymentId, paymentStatus, checkedIn }
```

### PromoEmail
```json
{ organizer, subject, body, targetEvents, totalSent, openCount, sentAt, status }
```

---

## 📚 Documentation

- **Setup**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **API Testing**: Use Postman/Insomnia with provided endpoint list
- **Debugging**: Check backend logs and browser DevTools

---

## 🗺️ Roadmap

### Phase 2 (Next)
- Multi-step event wizard
- Drag-drop form builder
- Complete Razorpay flow
- QR scanner for check-ins
- Public event landing pages

### Phase 3 (Future)
- Teams & collaborators
- Mobile check-in app
- Advanced analytics
- Webhook integrations
- Certificate generation

---

## 💡 Development Tips

1. **Backend**: Uses nodemon for auto-restart (`npm run dev`)
2. **Frontend**: Vite for instant HMR on code changes
3. **Local Email**: Comment SendGrid in `emailService.js` to use console logs
4. **Testing**: Start with auth flow, then event creation
5. **Debugging**: Use React DevTools + VS Code debugger

---

**Built with ❤️ for college event organizers**

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Start the dev server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📁 Project Structure

```
eventflow/
├── backend/
│   ├── controllers/       # Business logic for each route
│   ├── middleware/        # Auth, error handling, rate limiting, validation
│   ├── models/            # MongoDB schemas (User, Event, Registration, PromoEmail)
│   ├── routes/            # API route handlers
│   ├── services/          # Email, QR, CSV services
│   ├── utils/             # Helper functions
│   ├── server.js          # Express server entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/           # Axios instance and API endpoints
    │   ├── components/    # Reusable UI components (modal, cards, etc)
    │   ├── context/       # AuthContext for state management
    │   ├── pages/         # Full page components
    │   ├── hooks/         # Custom React hooks
    │   ├── utils/         # Helper functions and validators
    │   ├── App.jsx        # Main app with routing
    │   └── main.jsx       # React entry point
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## 🎨 Design System

- **Primary Color**: `#6C47FF` (electric purple)
- **Background**: `#0A0A0F` (dark)
- **Surfaces**: `#111118` (card surfaces), `#1E1E2E` (overlays)
- **Font**: Outfit (Google Fonts)

All Tailwind colors are extended in `tailwind.config.js`.

## 📚 API Routes

### Auth (`/api/auth`)
- `POST /register` - Create organizer account
- `POST /login` - Login organizer
- `GET /me` - Get current user (protected)
- `POST /forgot-password` - Initiate password reset
- `POST /reset-password/:token` - Reset password
- `GET /verify-email/:token` - Verify email

### Events (`/api/events`)
- `POST /` - Create event (protected)
- `GET /my` - Get organizer's events (protected)
- `GET /:slug` - Get public event by slug
- `PUT /:id` - Update event (protected)
- `DELETE /:id` - Soft delete event (protected)
- `POST /:id/publish` - Publish event (protected)
- `GET /:id/analytics` - Get event analytics (protected)

### Registrations (`/api/registrations`)
- `POST /` - Register attendee for event
- `GET /event/:eventId` - Get registrations (protected, owner only)
- `POST /checkin/:ticketId` - Check in attendee (protected)
- `GET /export/:eventId` - Export CSV (protected, owner only)

### Promo Emails (`/api/promo`)
- `POST /send` - Send promo email (protected)
- `GET /history` - Get promo email history (protected)

### Payouts (`/api/payouts`)
- `GET /` - Get payout summary (protected)

## 🔐 Security Features

✅ Password hashing with bcrypt (12 salt rounds)
✅ JWT authentication (7-day expiry)
✅ Protected dashboard routes
✅ Owner-only access to event data
✅ Rate limiting on auth & registration
✅ Helmet.js for HTTP headers
✅ CORS configured for CLIENT_URL only
✅ MongoDB injection protection (Mongoose + express-mongo-sanitize)
✅ XSS protection (xss-clean middleware)
✅ Input validation with Zod on frontend & backend
✅ File upload validation (5MB max, images only)

## 🎯 Key Features

| Feature | Status |
|---------|--------|
| Organizer signup/login with JWT | ✅ Ready |
| Email verification + password reset | ✅ Ready |
| Multi-step event creation wizard | 📋 Scaffolded |
| 5 landing page templates | 📋 Scaffolded |
| Drag-drop form builder (12 field types) | 📋 Scaffolded |
| Public event landing page | 📋 Scaffolded |
| Public registration with dynamic form | 📋 Scaffolded |
| Razorpay payment integration | 📋 Scaffolded |
| Auto QR ticket generation + email | ✅ Services ready |
| QR scanner check-in | 📋 Scaffolded |
| Registration dashboard with search/filter | 📋 Scaffolded |
| Analytics per event (charts) | 📋 Scaffolded |
| CSV export of registrations | ✅ Services ready |
| Promo email to past attendees | ✅ Services ready |
| Payout summary dashboard | 📋 Scaffolded |
| Organizer profile + settings | 📋 Scaffolded |

## 🛠️ Next Steps

1. **Backend Testing**: Test all API endpoints with Postman/Insomnia
2. **Frontend Pages**: Implement the dashboard pages and components
3. **Form Builder**: Implement drag-drop form builder
4. **Payment Integration**: Add Razorpay checkout flow
5. **QR Scanner**: Implement html5-qrcode for check-in
6. **Charts**: Add Recharts for analytics

## 📦 NPM Packages

### Backend
express, mongoose, bcryptjs, jsonwebtoken, nodemailer, @sendgrid/mail, qrcode, uuid, csv-writer, multer, express-rate-limit, helmet, cors, express-mongo-sanitize, xss-clean, dotenv, zod

### Frontend
react, react-dom, react-router-dom, axios, react-hook-form, @hookform/resolvers, zod, @dnd-kit/core, @dnd-kit/sortable, html5-qrcode, lucide-react, recharts, tailwindcss, @tailwindcss/forms

## 🚨 Important

- Keep `.env` files private (never commit them)
- Update JWT_SECRET to a secure random string in production
- Use environment-specific .env files for production
- Test all email templates in your email client
- Validate file uploads on both client and server

## 📞 Support

For issues or questions, refer to the inline code comments and documentation in each file.

---

**Built with ❤️ for college event organizers**
