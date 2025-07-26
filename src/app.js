const express = require('express');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://event-management-front-nine.vercel.app'
  ],
  credentials: true
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Import and use API routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Event Management API is running!');
});

// TODO: Add routes for users, services, bookings, reviews

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 