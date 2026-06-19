import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import promoEmailRoutes from './routes/promoEmailRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import attendeeroutes from './routes/Attendeeroutes.js';
import chatRoutes from './routes/Chatroutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { rawBodyMiddleware, webhookHandler } from './middleware/razorpayWebhook.js';

const app = express();

// ── Create http server from express app ──────────────────────
// This is the only change — httpServer wraps app, Socket.io attaches to it
const httpServer = createServer(app);

app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(xssClean());

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.eventglow.in',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming Origin:', origin);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.includes('.vercel.app')) return callback(null, true);
    if (origin.includes('.github.dev')) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Socket.io — now httpServer exists ────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

global.io = io;

io.on('connection', (socket) => {
  socket.on('join_room', (eventId) => {
    socket.join(`event_${eventId}`);
  });
  socket.on('leave_room', (eventId) => {
    socket.leave(`event_${eventId}`);
  });
  socket.on('disconnect', () => {});
});

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Rate Limiting ─────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/promo',         promoEmailRoutes);
app.use('/api/payouts',       payoutRoutes);
app.use('/api/transactions',  transactionRoutes);
app.use('/api/certificates',  certificateRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/attendee',      attendeeroutes);
app.use('/api/chat',          chatRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── DB + Start ────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventglow');
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

connectDB().then(() => {
  // ← httpServer.listen instead of app.listen — this is what makes Socket.io work
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.CLIENT_URL}`);
  });
});

export default app;