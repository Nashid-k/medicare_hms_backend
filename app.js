const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Operational',
    node: 'Clinical Node 04',
    uptime: '99.98%',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting'
  });
});

// Mount primary API routes
app.use('/api', apiRoutes);

module.exports = app;
