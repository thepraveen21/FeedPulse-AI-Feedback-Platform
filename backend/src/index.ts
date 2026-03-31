import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import feedbackRoutes from './routes/feedback.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();
console.log('Gemini Key loaded:', process.env.GEMINI_API_KEY?.slice(0, 10));

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many submissions from this IP, try again after an hour',
    data: null,
  },
  skip: (req) => req.method !== 'POST' || !req.path.includes('/feedback'),
});

app.use('/api/feedback', limiter);

// Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FeedPulse API is running',
    error: null,
    data: { status: 'OK', port: PORT },
  });
});

// 404 handler
app.use('*path', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    data: null,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;