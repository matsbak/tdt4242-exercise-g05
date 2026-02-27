const express = require('express');
const cors = require('cors');
const db = require('./db');
const assignmentRoutes = require('./routes/assignments');

const app = express();
const port = 3000;

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

app.listen(port, () => {
  console.log(`AI Guidebook server listening on port ${port}`);
});
