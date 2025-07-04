const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- SERVICES CRUD ---

// Get all services
router.get('/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get a single service by ID
router.get('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create a new service
router.post('/services', async (req, res) => {
  try {
    const { name, category, description, price, rating, reviewCount, location, duration, capacity, featured, image, images } = req.body;
    if (!name || !category || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newService = await prisma.service.create({
      data: {
        name,
        category,
        description,
        price: price || 0,
        rating: rating || 0,
        reviewCount: reviewCount || 0,
        location: location || '',
        duration: duration || '',
        capacity: capacity || '',
        featured: !!featured,
        image: image || '',
        images: images || '',
      },
    });
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update a service
router.patch('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updated = await prisma.service.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete a service
router.delete('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.service.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// --- USERS ---
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Register a new user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'user' },
    });
    // Create JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, 'your_jwt_secret', { expiresIn: '7d' });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Create JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, 'your_jwt_secret', { expiresIn: '7d' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Missing token' })
  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' })
    req.user = user
    next()
  })
}

// --- BOOKINGS ---
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { user: true, service: true }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a new booking (with double-booking prevention)
router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const { serviceId, date, price, status } = req.body;
    const userId = req.user.userId;
    if (!userId || !serviceId || !date) {
      return res.status(400).json({ error: 'userId, serviceId, and date are required' });
    }
    // Prevent double-booking: check if a booking exists for the same service and date
    const existing = await prisma.booking.findFirst({
      where: {
        serviceId: Number(serviceId),
        date: new Date(date),
        status: { not: 'cancelled' },
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'This service is already booked for the selected date/time.' });
    }
    const booking = await prisma.booking.create({
      data: {
        userId: Number(userId),
        serviceId: Number(serviceId),
        date: new Date(date),
        price: price || 0,
        status: status || 'confirmed',
      },
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// --- REVIEWS ---
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: true, service: true }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router; 