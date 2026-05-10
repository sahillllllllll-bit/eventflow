# EventFlow Setup & Deployment Guide

## ✅ What's Complete

### Backend (Production-Ready)
- ✅ User authentication (JWT, bcrypt)
- ✅ Email verification & password reset
- ✅ Event management (CRUD operations)
- ✅ Registration system with QR generation
- ✅ Promo email service
- ✅ Payout/earnings tracking
- ✅ CSV export functionality
- ✅ Rate limiting, CORS, helmet security
- ✅ Zod validation on all routes
- ✅ Error handling middleware

### Frontend (MVP-Ready)
- ✅ Complete dashboard with sidebar navigation
- ✅ Landing page with pricing
- ✅ Auth pages (login, register)
- ✅ Dashboard home with metrics
- ✅ Events management (list, search, filter)
- ✅ Event detail page with tabs
- ✅ Payouts dashboard
- ✅ Promo email composer
- ✅ Settings/profile page
- ✅ Toast notifications
- ✅ Modal dialogs
- ✅ Responsive design

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v16+ and npm
- MongoDB (local or Atlas)
- Git

### Step 1: Clone/Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventflow
JWT_SECRET=your_super_secret_key_generate_random_string_here
JWT_EXPIRES_IN=7d
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
EMAIL_FROM=noreply@eventflow.in
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

Start backend:
```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### Step 2: Setup Frontend

```bash
cd frontend
npm install
```

Ensure `.env.local` exists:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

### Step 3: Test the Flow

1. **Register**: Go to `/register`, create an account
2. **Verify**: Check email (in SendGrid or console logs locally)
3. **Create Event**: Navigate to dashboard → Create Event
4. **Share Event**: Share the public link from events page
5. **Test Registration**: Open public event link in incognito → Register
6. **Check In**: Go to event detail → Check-in tab (QR scanner coming soon)

---

## 🗄️ MongoDB Setup

### Local MongoDB
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows (using MongoDB Installer or Docker)
mongod
```

### MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/eventflow`
4. Add to `.env` as `MONGO_URI`

---

## 📧 SendGrid Setup (Emails)

1. Create [SendGrid account](https://sendgrid.com)
2. Create API key
3. Add to `.env`:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

**Local Testing**: Comment out SendGrid in `services/emailService.js` to use console logs instead.

---

## 💳 Razorpay Setup (Payments - Optional)

1. Create [Razorpay account](https://razorpay.com)
2. Get test keys from dashboard
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

---

## 📝 API Testing

Use **Postman** or **Insomnia** to test endpoints:

### Auth Flow
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@college.edu",
  "password": "password123",
  "college": "XYZ College"
}

POST /api/auth/login
{
  "email": "john@college.edu",
  "password": "password123"
}

GET /api/auth/me
Header: Authorization: Bearer <token>
```

### Event Flow
```
POST /api/events
Header: Authorization: Bearer <token>
{
  "title": "Tech Fest 2024",
  "category": "fest",
  "date": "2024-06-15",
  "maxCapacity": 500
}

GET /api/events/my
Header: Authorization: Bearer <token>

POST /api/events/{id}/publish
Header: Authorization: Bearer <token>
```

---

## 🏗️ Project Structure Recap

```
eventflow/
├── backend/
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, validation, error handling
│   ├── models/             # MongoDB schemas
│   ├── routes/             # Express route handlers
│   ├── services/           # Email, QR, CSV
│   ├── utils/              # Helpers
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios + endpoints
│   │   ├── components/     # Reusable UI (Sidebar, Modal, etc)
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # Custom hooks (useToast)
│   │   ├── pages/          # Full pages (Dashboard, Events, etc)
│   │   ├── utils/          # Helpers
│   │   ├── App.jsx         # Router setup
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🎯 Next Priority Features

### High Priority (MVP+)
1. **Multi-step Event Creation** - Form builder with drag-drop fields
2. **5 Event Templates** - Bold, Minimal, Gradient, Dark, Glass
3. **Razorpay Integration** - Full payment flow for paid events
4. **QR Scanner** - Check-in functionality using html5-qrcode
5. **Public Event Page** - Beautiful landing page templates

### Medium Priority
1. Analytics charts (Recharts integration)
2. Event templates customization
3. Email templates editor
4. Advanced registration form builder
5. CSV import/export for bulk operations

### Future Features
1. Teams & collaborators
2. Ticket scanning mobile app
3. Advanced analytics & reports
4. Zapier/webhook integrations
5. Certification generation

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `sudo service mongod start`
- Check connection string in `.env`
- Verify IP whitelist in MongoDB Atlas (if cloud)

### "Email not sending"
- Check SendGrid API key is valid
- Verify `EMAIL_FROM` domain is added in SendGrid
- Check spam folder

### "Token not persisting on refresh"
- Token is stored in localStorage (see `AuthContext.jsx`)
- Clear localStorage: `localStorage.clear()` in browser console
- Re-login

### "Port 5000/5173 already in use"
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

---

## 📦 Deployment Checklist

- [ ] Update `JWT_SECRET` to secure random string
- [ ] Switch to MongoDB Atlas for database
- [ ] Setup SendGrid production credentials
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set `NODE_ENV=production`
- [ ] Update `CLIENT_URL` to production domain
- [ ] Setup GitHub Actions or similar for CI/CD
- [ ] Configure CORS for production domain
- [ ] Setup error tracking (Sentry, etc)
- [ ] Configure rate limiting for production
- [ ] Backup strategy for MongoDB
- [ ] Monitor logs and performance

---

## 🔗 Useful Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [SendGrid Email API](https://sendgrid.com/docs/API-Reference/)
- [Razorpay Docs](https://razorpay.com/docs/)

---

## 💡 Tips

1. **Local Development**: Use `nodemon` for auto-restart on backend changes
2. **Debugging**: Use React DevTools extension + VS Code debugger
3. **Mock Data**: Seed database with test events and users
4. **Email Testing**: Use Mailtrap for email testing locally
5. **API Documentation**: Consider adding Swagger/OpenAPI docs

---

*Last updated: May 2024*
*Status: MVP Ready for User Testing*
