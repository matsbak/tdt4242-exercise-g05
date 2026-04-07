import express from 'express';
import cors from 'cors';
import assignmentRoutes from './routes/assignments.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API 404 fallback (always JSON)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// API error handler (always JSON)
app.use((err, req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    console.error('Unhandled API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  return next(err);
});

export default app;
