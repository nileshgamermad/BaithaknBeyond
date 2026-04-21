import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
import { connectDB } from './config/db.js';
import storyRoutes from './routes/stories.js';
import authRoutes from './routes/auth.js';
import bookmarkRoutes from './routes/bookmarks.js';
import interactionRoutes from './routes/interactions.js';
import collectionRoutes from './routes/collections.js';
import userRoutes from './routes/users.js';
const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiters
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait 15 minutes.' },
});

// Trust Render/proxy X-Forwarded-For headers (required for rate limiting)
app.set('trust proxy', 1);

// Connect to MongoDB Atlas
connectDB();

// CORS — allow requests from the frontend dev server and production origin
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://baithaknbeyond.com',
  'https://www.baithaknbeyond.com',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Serve test page at http://localhost:5000/test.html (same-origin → no CORS)
app.use(express.static(path.join(__dirname, '../scripts')));

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/send-otp-secure', otpLimiter);

app.use('/api/stories', storyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Baithak & Beyond API is running' });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
