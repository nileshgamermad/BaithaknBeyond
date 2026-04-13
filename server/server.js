import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import storyRoutes from './routes/stories.js';
import authRoutes from './routes/auth.js';
import bookmarkRoutes from './routes/bookmarks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// CORS — allow requests from the frontend dev server and production origin
const allowedOrigins = [
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

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/stories', storyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Baithak & Beyond API is running' });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
