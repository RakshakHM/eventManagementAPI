const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.service.deleteMany();

  // Upsert users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'test123',
      role: 'user',
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'test123',
      role: 'user',
    },
  });

  // Camera services
  const cameraImages = [
    '/service-images/camera1.jpeg',
    '/service-images/camera2.jpeg',
    '/service-images/camera3.jpeg',
    '/service-images/camera4.jpeg',
    '/service-images/camera5.jpeg',
  ];
  const service1 = await prisma.service.create({
    data: {
      name: 'Pixel Perfect Photography',
      category: 'cameras',
      description: 'Professional photography services',
      price: 25000,
      rating: 4.8,
      reviewCount: 45,
      location: 'Indiranagar',
      duration: '4-8 hours',
      capacity: 'Any',
      featured: true,
      image: cameraImages[0],
      images: cameraImages.join(','),
    },
  });

  // Additional Camera services
  await prisma.service.create({
    data: {
      name: 'Budget Clicks Photography',
      category: 'cameras',
      description: 'Affordable photography services for small events and gatherings. Quality photos without breaking the bank.',
      price: 15000,
      rating: 4.2,
      reviewCount: 28,
      location: 'Koramangala',
      duration: '2-4 hours',
      capacity: 'Any',
      featured: false,
      image: '/service-images/camera2.jpeg',
      images: cameraImages.join(','),
    },
  });
  await prisma.service.create({
    data: {
      name: 'Cinematic Moments',
      category: 'cameras',
      description: 'Premium videography services with top-of-the-line equipment.',
      price: 45000,
      rating: 4.9,
      reviewCount: 38,
      location: 'MG Road',
      duration: 'Full day coverage',
      capacity: 'Any',
      featured: true,
      image: cameraImages[2],
      images: cameraImages.join(','),
    },
  });
  await prisma.service.create({
    data: {
      name: 'Corporate Lens',
      category: 'cameras',
      description: 'Specialized photography for corporate events and conferences.',
      price: 30000,
      rating: 4.4,
      reviewCount: 19,
      location: 'Electronic City',
      duration: 'As needed',
      capacity: 'Any',
      featured: false,
      image: cameraImages[3],
      images: cameraImages.join(','),
    },
  });

  // Hall services
  const hallImages = [
    '/service-images/hall1.jpeg',
    '/service-images/hall2.jpeg',
    '/service-images/hall3.jpeg',
    '/service-images/hall4.jpeg',
    '/service-images/hall5.jpeg',
  ];
  const service2 = await prisma.service.create({
    data: {
      name: 'Bangalore Palace Convention Center',
      category: 'halls',
      description: 'Elegant and spacious convention hall',
      price: 150000,
      rating: 4.5,
      reviewCount: 32,
      location: 'Palace Grounds',
      duration: 'Full day',
      capacity: '500',
      featured: true,
      image: hallImages[0],
      images: hallImages.join(','),
    },
  });

  // Additional Hall services
  await prisma.service.create({
    data: {
      name: 'Whitefield Conference Center',
      category: 'halls',
      description: 'Modern conference facility ideal for business meetings, workshops, and small gatherings. Equipped with projector, whiteboard, and high-speed internet.',
      price: 50000,
      rating: 4.0,
      reviewCount: 15,
      location: 'Whitefield',
      duration: 'Half day or full day',
      capacity: '150',
      featured: false,
      image: '/service-images/hall2.jpeg',
      images: hallImages.join(','),
    },
  });
  await prisma.service.create({
    data: {
      name: 'Tamarind Tree',
      category: 'halls',
      description: 'Beautiful heritage venue with garden views and elegant spaces.',
      price: 200000,
      rating: 4.7,
      reviewCount: 42,
      location: 'Yelahanka',
      duration: 'Full day',
      capacity: '300',
      featured: true,
      image: hallImages[2],
      images: hallImages.join(','),
    },
  });
  await prisma.service.create({
    data: {
      name: 'Lalbagh Garden Party Venue',
      category: 'halls',
      description: 'Outdoor venue near Lalbagh Botanical Garden, perfect for daytime events.',
      price: 80000,
      rating: 4.6,
      reviewCount: 25,
      location: 'Lalbagh',
      duration: 'Full day',
      capacity: '150',
      featured: false,
      image: hallImages[3],
      images: hallImages.join(','),
    },
  });

  // Decorator services
  const decorImages = [
    '/service-images/decor1.jpeg',
    '/service-images/decor2.jpeg',
    '/service-images/decor3.jpeg',
    '/service-images/decor4.jpeg',
    '/service-images/decor5.jpeg',
  ];
  const service3 = await prisma.service.create({
    data: {
      name: 'Mysore Silk Decorators',
      category: 'decorators',
      description: 'Beautiful floral arrangements and traditional decorations',
      price: 35000,
      rating: 4.9,
      reviewCount: 56,
      location: 'Jayanagar',
      duration: 'Setup day before event',
      capacity: 'Any',
      featured: true,
      image: decorImages[0],
      images: decorImages.join(','),
    },
  });

  // Additional Decorator services
  await prisma.service.create({
    data: {
      name: 'Simple Elegance Decorators',
      category: 'decorators',
      description: 'Simple and elegant decoration services for events on a budget. Includes basic table settings, backdrop, and minimal floral arrangements.',
      price: 20000,
      rating: 4.3,
      reviewCount: 22,
      location: 'Marathahalli',
      duration: 'Setup on event day',
      capacity: 'Any',
      featured: false,
      image: '/service-images/decor2.jpeg',
      images: decorImages.join(','),
    },
  });
  await prisma.service.create({
    data: {
      name: 'Royal Decor',
      category: 'decorators',
      description: 'Luxury decoration services for high-end events.',
      price: 75000,
      rating: 4.8,
      reviewCount: 31,
      location: 'Sadashivanagar',
      duration: 'Setup day before event',
      capacity: 'Any',
      featured: true,
      image: decorImages[2],
      images: decorImages.join(','),
    },
  });
  await prisma.service.create({
    data: {
      name: 'Bangalore Theme Decorators',
      category: 'decorators',
      description: 'Custom themed decorations for special events.',
      price: 50000,
      rating: 4.7,
      reviewCount: 33,
      location: 'Malleshwaram',
      duration: 'Setup 1-2 days before event',
      capacity: 'Any',
      featured: false,
      image: decorImages[3],
      images: decorImages.join(','),
    },
  });

  // Create bookings
  await prisma.booking.create({
    data: {
      userId: user1.id,
      serviceId: service1.id,
      date: new Date('2024-07-01T10:00:00.000Z'),
      price: 25000,
      status: 'confirmed',
    },
  });

  // Create reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      serviceId: service1.id,
      rating: 5,
      comment: 'Amazing service!',
      date: new Date('2024-07-01T10:00:00.000Z'),
      avatar: '/placeholder-user.jpg',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 