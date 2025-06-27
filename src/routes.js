const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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