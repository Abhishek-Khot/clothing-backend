const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

// Load env vars
dotenv.config();

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('Cloudinary configured successfully');
} else {
  console.warn('Cloudinary credentials not found. Image uploads will not work properly.');
  console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
}

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Enable CORS for frontend
// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(require('cors')({ origin: ['http://localhost:3000', 'https://unique-collection-web.onrender.com'], credentials: true }));

// Set up static files
app.use(express.static(path.join(__dirname, 'public')));

// Commented out local uploads directory since we're using Cloudinary
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes and controllers
const productRoutes = require('./routes/productRoutes');
const { uploadSingleImage, uploadGalleryImages } = require('./middleware/multer');

// Mount API routes
app.use('/api', productRoutes);

// Admin routes
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Basic route
app.get('/', (req, res) => {
  res.render('index', { title: 'Welcome' });
});



// Mount admin and frontend routes
app.use('/', productRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Page Not Found',
    error: { status: 404 }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : { status: 500 }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`API Endpoint: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
