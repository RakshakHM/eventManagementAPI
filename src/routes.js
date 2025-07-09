const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage for service images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/service-images/'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Use Date.now(), a random number, and the original filename for uniqueness
    cb(null, `service_${req.params.id}_${Date.now()}_${Math.round(Math.random() * 1e9)}_${file.originalname}`);
  },
});
const upload = multer({ storage });

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

// Update the DELETE /services/:id endpoint to prevent deletion if bookings exist
router.delete('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Check for existing bookings
    const bookingCount = await prisma.booking.count({ where: { serviceId: id } });
    if (bookingCount > 0) {
      return res.status(400).json({ error: 'Cannot delete service with existing bookings.' });
    }
    await prisma.service.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Upload/replace service image
router.post('/services/:id/image', upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    // Remove old image if exists
    const service = await prisma.service.findUnique({ where: { id } });
    if (service && service.image) {
      const oldPath = path.join(__dirname, '../public/service-images/', path.basename(service.image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    // Save new image path (relative to public)
    const imagePath = `/service-images/${req.file.filename}`;
    const updated = await prisma.service.update({ where: { id }, data: { image: imagePath } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Remove service image
router.delete('/services/:id/image', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const service = await prisma.service.findUnique({ where: { id } });
    if (service && service.image) {
      const imgPath = path.join(__dirname, '../public/service-images/', path.basename(service.image));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    const updated = await prisma.service.update({ where: { id }, data: { image: '' } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

// --- GALLERY IMAGES ---
// Upload multiple gallery images
router.post('/services/:id/gallery', upload.array('images'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });
    const service = await prisma.service.findUnique({ where: { id } });
    let gallery = [];
    if (service && service.images) {
      gallery = service.images.split(',').filter(Boolean);
    }
    // ENFORCE LIMIT: Only allow up to 4 gallery images
    if (gallery.length + req.files.length > 4) {
      return res.status(400).json({ error: 'Maximum of 4 gallery images allowed.' });
    }
    // Save new image paths (relative to public)
    const newImages = req.files.map(file => `/service-images/${file.filename}`);
    const updatedGallery = [...gallery, ...newImages];
    const updated = await prisma.service.update({ where: { id }, data: { images: updatedGallery.join(',') } });
    res.json(updated);
  } catch (error) {
    console.error("Gallery upload error:", error); // Log the real error
    res.status(500).json({ error: 'Failed to upload gallery images' });
  }
});

// Remove a gallery image
router.delete('/services/:id/gallery/:imageName', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { imageName } = req.params;
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    let gallery = service.images ? service.images.split(',').filter(Boolean) : [];
    const imagePath = `/service-images/${imageName}`;
    gallery = gallery.filter(img => img !== imagePath);
    // Delete file from disk
    const filePath = path.join(__dirname, '../public/service-images/', imageName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const updated = await prisma.service.update({ where: { id }, data: { images: gallery.join(',') } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove gallery image' });
  }
});

// Reorder gallery images
router.patch('/services/:id/gallery', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { images } = req.body; // images: array of image paths
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Images must be an array' });
    const updated = await prisma.service.update({ where: { id }, data: { images: images.join(',') } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder gallery images' });
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

// Get bookings for a specific service (for debugging)
router.get('/bookings/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const bookings = await prisma.booking.findMany({
      where: {
        serviceId: Number(serviceId),
        status: { not: 'cancelled' },
      },
      include: { user: true, service: true },
      orderBy: { date: 'asc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Check availability for a service on a specific date
router.get('/availability/:serviceId/:date', async (req, res) => {
  try {
    const { serviceId, date } = req.params;
    const checkDate = new Date(date);
    // Use UTC for start and end of day
    const startOfDay = new Date(Date.UTC(
      checkDate.getUTCFullYear(),
      checkDate.getUTCMonth(),
      checkDate.getUTCDate(),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      checkDate.getUTCFullYear(),
      checkDate.getUTCMonth(),
      checkDate.getUTCDate(),
      23, 59, 59, 999
    ));
    // Check if there's already a booking for this service on this date
    const existingBooking = await prisma.booking.findFirst({
      where: {
        serviceId: Number(serviceId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'cancelled' },
      },
    });
    res.json({
      available: !existingBooking,
      message: existingBooking ? 'This date is already booked' : 'Date is available'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check availability' });
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
    const checkDate = new Date(date);
    // Use UTC for start and end of day
    const startOfDay = new Date(Date.UTC(
      checkDate.getUTCFullYear(),
      checkDate.getUTCMonth(),
      checkDate.getUTCDate(),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      checkDate.getUTCFullYear(),
      checkDate.getUTCMonth(),
      checkDate.getUTCDate(),
      23, 59, 59, 999
    ));
    // Prevent double-booking: check if a booking exists for the same service and date
    const existing = await prisma.booking.findFirst({
      where: {
        serviceId: Number(serviceId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
        date: startOfDay, // Store at UTC start of day for consistency
        price: price || 0,
        status: status || 'confirmed',
      },
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update a booking's status
router.patch('/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking status' });
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

// Admin dashboard stats endpoint
router.get('/admin/stats', async (req, res) => {
  try {
    // Total bookings
    const totalBookings = await prisma.booking.count();
    // Total revenue
    const totalRevenueResult = await prisma.booking.aggregate({ _sum: { price: true } });
    const totalRevenue = totalRevenueResult._sum.price || 0;
    // Bookings by status
    const confirmedBookings = await prisma.booking.count({ where: { status: 'confirmed' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'cancelled' } });
    // Most popular services (top 3 by booking count)
    const popularServices = await prisma.booking.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: 3,
    });
    // Get service details for popular services
    const popularServiceDetails = await Promise.all(
      popularServices.map(async (s) => {
        const service = await prisma.service.findUnique({ where: { id: s.serviceId } });
        return { ...service, bookingCount: s._count.serviceId };
      })
    );
    // Total number of services
    const totalServices = await prisma.service.count();
    res.json({
      totalBookings,
      totalRevenue,
      bookingsByStatus: {
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
      },
      popularServices: popularServiceDetails,
      totalServices,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

module.exports = router; 