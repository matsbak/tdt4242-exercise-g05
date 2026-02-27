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

app.listen(port, () => {
  console.log(`AI Guidebook server listening on port ${port}`);
});
