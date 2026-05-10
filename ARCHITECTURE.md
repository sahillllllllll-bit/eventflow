# EventFlow Architecture & Deployment Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Pages: 16 routes (auth, dashboard, events, etc)    │   │
│  │  Components: Sidebar, Cards, Modal, Badge           │   │
│  │  State: AuthContext + localStorage                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HTTP Client: Axios with JWT Interceptor            │   │
│  │  25 API Functions: auth, events, registrations      │   │
│  │  Base URL: http://localhost:5000/api                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Port: 5173 | Tech: React 18.2 + Vite 5 + TailwindCSS 3.3   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                         (REST API)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routes: 27 endpoints across 5 route files          │   │
│  │  Auth (6) | Events (7) | Registrations (4)          │   │
│  │  Promo (2) | Payouts (1) | Utils (1)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Controllers: 5 files with business logic           │   │
│  │  Auth | Events | Registrations | Promo | Payouts    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Middleware Stack:                                  │   │
│  │  1. Helmet (security headers)                       │   │
│  │  2. CORS (frontend domain only)                     │   │
│  │  3. Sanitize (MongoDB injection prevention)         │   │
│  │  4. XSS Protection                                  │   │
│  │  5. Rate Limiting (auth, registration, general)     │   │
│  │  6. Body Parser                                     │   │
│  │  7. Routes                                          │   │
│  │  8. Error Handler (centralized)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Port: 5000 | Tech: Express 4.18 | Node.js                  │
└─────────────────────────────────────────────────────────────┘
                              ↕
                     (Mongoose ODM)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (MongoDB)                         │
│                                                               │
│  Collections:                                               │
│  ├── Users (name, email, password, college, phone)         │
│  ├── Events (title, slug, date, formSections)             │
│  ├── Registrations (ticketId, qrCode, responses)          │
│  └── PromoEmails (subject, body, targetEvents)            │
│                                                               │
│  Indexes: email (unique), slug (unique), ticketId (unique) │
│  Location: Local or MongoDB Atlas                          │
└─────────────────────────────────────────────────────────────┘

                        External Services
                              ↓
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
   SendGrid SMTP          Razorpay API             QR Code Gen
   (Email Service)    (Payment Processing)      (base64 PNG)
```

---

## 🔄 Data Flow Diagrams

### Authentication Flow
```
User → Register Form
  ↓
POST /api/auth/register
  ↓
Backend: Hash password + Create user + Send verification email
  ↓
Response: JWT token + User object
  ↓
Frontend: Store in localStorage + Set AuthContext
  ↓
Auto-redirect: Dashboard (ProtectedRoute checks token)
```

### Event Creation Flow
```
Organizer → Create Event Form
  ↓
POST /api/events (with JWT)
  ↓
Backend: Create event + Auto-generate slug + Initial state = draft
  ↓
Response: Event object with _id
  ↓
Frontend: Add to events list + Show success toast
  ↓
Organizer → Update form sections → POST /api/events/:id
  ↓
Organizer → Publish → POST /api/events/:id/publish
  ↓
Status changes: draft → published
  ↓
Public URL: /events/:slug (no auth required)
```

### Registration Flow
```
Attendee → Public Event Page
  ↓
View dynamic form (formSections)
  ↓
Fill form → POST /api/registrations
  ↓
Backend: 
  - Generate ticketId (UUID)
  - Generate QR code (base64 PNG)
  - Save registration + responses
  - Increment event.currentRegistrations
  - Send confirmation email with QR
  ↓
Response: ticketId + qrCode
  ↓
Frontend: Show confirmation + QR code
  ↓
Attendee: Email receives ticket with QR
  ↓
At Event: Scan QR → Check-in
```

---

## 📱 API Integration Pattern

```javascript
// Frontend Example: How data flows through the app

// 1. Axios Setup (api/axios.js)
const instance = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
});

// Request Interceptor: Add JWT
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401
instance.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
});

// 2. API Endpoints (api/endpoints.js)
export const eventAPI = {
  getMyEvents: (params) => 
    instance.get('/events/my', { params }),
  
  createEvent: (data) => 
    instance.post('/events', data),
};

// 3. Component Usage (pages/DashboardHome.jsx)
useEffect(() => {
  const fetchEvents = async () => {
    try {
      const res = await eventAPI.getMyEvents();
      setEvents(res.data.events);
    } catch (err) {
      showToast('Failed to load', 'error');
    }
  };
  fetchEvents();
}, []);
```

---

## 🗄️ Database Design

### User Schema
```
User {
  _id: ObjectId
  name: String (required)
  email: String (unique, required)
  password: String (hashed, required)
  college: String
  phone: String
  profilePhoto: String
  organizerSlug: String (unique, auto-generated)
  totalEventsCreated: Number (default: 0)
  totalAttendeesReached: Number (default: 0)
  isVerified: Boolean (default: false)
  emailVerifyToken: String
  resetPasswordToken: String
  resetPasswordExpire: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}

Indexes: email (unique), organizerSlug (unique)
```

### Event Schema
```
Event {
  _id: ObjectId
  organizer: ObjectId (ref: User)
  title: String (required)
  slug: String (unique, auto-generated from title)
  description: String
  coverImage: String (URL)
  template: String (enum: minimal, bold, gradient, dark, glass)
  category: String (enum: fest, workshop, hackathon, competition, seminar, other)
  
  date: Date (required)
  endDate: Date
  venue: String
  venueMapLink: String
  isOnline: Boolean
  meetLink: String
  
  isPaid: Boolean
  ticketPrice: Number
  maxCapacity: Number
  currentRegistrations: Number (default: 0)
  
  formSections: [
    {
      id: String
      type: String (11 types available)
      label: String
      placeholder: String
      required: Boolean
      options: [String] (for dropdowns/radio/checkbox)
      order: Number
    }
  ]
  
  status: String (enum: draft, published, completed, cancelled)
  allowPromoEmails: Boolean
  tags: [String]
  
  createdAt: Date
  updatedAt: Date
}

Indexes: slug (unique), organizer
Relations: organizer → User, referenced by Registration & PromoEmail
```

### Registration Schema
```
Registration {
  _id: ObjectId
  event: ObjectId (ref: Event)
  organizer: ObjectId (ref: User)
  
  ticketId: String (unique, UUID-like)
  name: String
  email: String
  phone: String
  
  responses: Map<String, any> (form field responses)
  
  qrCode: String (base64 PNG)
  isPaid: Boolean
  paymentId: String (Razorpay ID)
  paymentStatus: String (enum: pending, paid, free)
  amountPaid: Number
  
  checkedIn: Boolean (default: false)
  checkedInAt: Date
  
  consentPromoEmails: Boolean
  registeredAt: Date (auto, used for email history)
}

Indexes: ticketId (unique), event, organizer, email
Relations: event → Event, organizer → User
```

### PromoEmail Schema
```
PromoEmail {
  _id: ObjectId
  organizer: ObjectId (ref: User)
  
  subject: String
  body: String
  targetEvents: [ObjectId] (ref: Event)
  
  totalSent: Number
  openCount: Number
  sentAt: Date
  status: String (enum: draft, sent, failed)
  
  createdAt: Date
  updatedAt: Date
}

Relations: organizer → User, targetEvents → Event
```

---

## 🚀 Deployment Architecture

### Development Environment
```
Local Machine
├── Frontend: localhost:5173 (npm run dev)
├── Backend: localhost:5000 (npm run dev)
└── MongoDB: localhost:27017 (local instance)
```

### Production Architecture
```
┌─────────────────────────────────────────────────┐
│              CDN / Cloudflare                    │
│                                                   │
│  ├── Static Assets Cache                        │
│  ├── DDoS Protection                            │
│  └── SSL/TLS Termination                        │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────────┐  ┌──────────────────┐
│  Frontend SPA    │  │   Backend API    │
│  (Vercel/Netlify)│  │   (Heroku/Railway)│
│                  │  │                  │
│  • React Build   │  │  • Express.js    │
│  • Static Assets │  │  • Node.js       │
│  • SPA Routing   │  │  • JWT Auth      │
│  • API Calls     │  │  • Rate Limiting │
└──────────────────┘  └────────┬─────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                   ┌────▼─────┐  ┌───▼─────┐
                   │  MongoDB  │  │SendGrid │
                   │  (Atlas)  │  │  SMTP   │
                   └──────────┘  └─────────┘
                        │
                   ┌────▼──────────┐
                   │  Razorpay API  │
                   │  (Payments)    │
                   └────────────────┘
```

### Environment Variables by Stage

#### Development (.env / .env.local)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventflow
JWT_SECRET=dev_secret_key_change_this
SENDGRID_API_KEY=SG.dev_key
CLIENT_URL=http://localhost:5173
```

#### Production (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/eventflow
JWT_SECRET=$(openssl rand -hex 32)  # Secure random
SENDGRID_API_KEY=SG.production_key
CLIENT_URL=https://eventflow.in
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NODE_ENV=production
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy EventFlow

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: 18
      
      - name: Install Backend Dependencies
        run: cd backend && npm install
      
      - name: Run Backend Tests
        run: cd backend && npm test
      
      - name: Build Backend
        run: cd backend && npm run build
      
      - name: Deploy Backend
        run: |
          # Deploy to Railway/Heroku
          git subtree push --prefix backend heroku main
      
      - name: Install Frontend Dependencies
        run: cd frontend && npm install
      
      - name: Build Frontend
        run: cd frontend && npm run build
      
      - name: Deploy Frontend
        run: |
          # Deploy to Vercel/Netlify
          npx vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Scalability Considerations

### Current Capacity
- ✅ Small colleges: 1,000-5,000 users
- ✅ Small events: 500-1,000 registrations
- ✅ Moderate traffic: 100-500 concurrent users

### Scaling Strategies

1. **Database Optimization**
   - Add indexes on frequently queried fields
   - Implement pagination (already done)
   - Use MongoDB aggregation pipelines
   - Archive old registrations

2. **API Optimization**
   - Add caching (Redis)
   - Implement GraphQL for flexible queries
   - Use CDN for static assets
   - Add load balancing

3. **Infrastructure**
   - Horizontal scaling: Multiple Node instances
   - Docker containerization
   - Kubernetes orchestration
   - Multi-region deployment

4. **Database Scaling**
   - MongoDB sharding
   - Read replicas
   - Connection pooling

---

## 🔒 Security Hardening for Production

1. **Environment & Secrets**
   - Use secret management (AWS Secrets Manager)
   - Rotate JWT_SECRET regularly
   - Use different keys per environment

2. **API Security**
   - Implement CORS whitelist
   - Add API key authentication for external services
   - Use HTTPS/TLS 1.3+
   - Implement request signing

3. **Database Security**
   - Enable MongoDB authentication
   - Use VPC/Private network
   - Regular backups
   - Encryption at rest

4. **Application Security**
   - Implement CSRF protection
   - Add session management
   - Use secure cookies
   - Implement audit logging

---

## 📈 Monitoring & Observability

### Logging
```javascript
// Morgan for HTTP logs
app.use(morgan('combined'));

// Custom error logger
logger.error('Event creation failed', {
  error: err.message,
  userId: req.user._id,
  timestamp: new Date(),
});
```

### Metrics to Track
- API response times
- Error rates by endpoint
- Database query performance
- Active user sessions
- Email delivery success

### Recommended Tools
- **Logging**: Winston, Datadog
- **Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry
- **Performance**: Lighthouse CI
- **Uptime**: UptimeRobot

---

## 📋 Pre-Deployment Checklist

- [ ] All tests pass (unit + integration)
- [ ] No console errors in frontend/backend
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificate obtained
- [ ] CORS whitelist updated
- [ ] Rate limiting thresholds adjusted
- [ ] Error tracking setup (Sentry)
- [ ] Monitoring configured
- [ ] Backup & restore procedures tested
- [ ] Load testing completed
- [ ] Security audit passed

---

**Last Updated**: May 2024  
**Version**: 1.0 (MVP)
