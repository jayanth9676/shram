require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.set('wss', wss);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Add this near the top of the file
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Increase to 10 seconds
  socketTimeoutMS: 45000,
  family: 4
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Add this route before the userRoutes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Use routes
app.use('/api', userRoutes);

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    handleWebSocketMessage(ws, data);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'UPDATE_SCORE':
      // Broadcast the updated score to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'SCORE_UPDATE',
            username: data.username,
            score: data.score
          }));
        }
      });
      break;
    default:
      console.warn('Unknown WebSocket message type:', data.type);
  }
}

// Improve error handling for WebSocket connections
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.timeout = 120000; // Set timeout to 2 minutes

// After your mongoose.connect() call
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.error('MongoDB connection string:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//****:****@'));
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Add this after your routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Add this after your API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});