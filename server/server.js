import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import storyRoutes from './routes/stories.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// CORS — allow requests from the frontend dev server and production origin
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'https://nilescodes.github.io',   // update to your GitHub Pages domain
    ],
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/stories', storyRoutes);
app.use('/api/auth', authRoutes);

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
