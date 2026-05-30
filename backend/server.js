import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import promoEmailRoutes from './routes/promoEmailRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { rawBodyMiddleware, webhookHandler } from './middleware/razorpayWebhook.js';

const app = express();
app.set('trust proxy', 1); 

// ==================
// Middleware Setup
// ==================

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xssClean());

// ==================
// CORS Configuration
// ==================

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Incoming Origin:', origin);

    // Allow requests with no origin
    // (Postman, mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Allow exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel deployments
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // Allow GitHub Codespaces
    if (origin.includes('.github.dev')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ==================
// Body Parsing
// ==================

app.use(express.json({ limit: '50mb' }));

app.use(
  express.urlencoded({
    limit: '50mb',
    extended: true,
  })
);

// ==================
// Rate Limiting
// ==================

app.use('/api/', generalLimiter);

// ==================
// Routes
// ==================

app.use('/api/auth', authRoutes);

app.use('/api/events', eventRoutes);

app.use('/api/registrations', registrationRoutes);

app.use('/api/promo', promoEmailRoutes);

app.use('/api/payouts', payoutRoutes);

app.use('/api/transactions', transactionRoutes);

app.use('/api/certificates', certificateRoutes);

app.use('/api/payments', paymentRoutes);
// ==================
// Health Check
// ==================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// ==================
// 404 Handler
// ==================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ==================
// Global Error Handler
// ==================

app.use(errorHandler);

// ==================
// Database Connection
// ==================

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/eventglow';

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// ==================
// Start Server
// ==================

const PORT = process.env.PORT || 5000;

const HOST = process.env.HOST || '0.0.0.0';

connectDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(
      `Environment: ${process.env.NODE_ENV || 'development'}`
    );
    console.log(`Frontend URL: ${process.env.CLIENT_URL}`);
  });
});

export default app;