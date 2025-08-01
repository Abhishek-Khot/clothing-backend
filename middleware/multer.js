const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  // console.log('Cloudinary configured successfully');
} else {
  console.warn('Cloudinary credentials not found. Image uploads will not work properly.');
  console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
}

// Set up Cloudinary storage for uploaded files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'clothing-store',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' }
    ],
    resource_type: 'image',
    eager: [
      { width: 300, height: 300, crop: 'thumb' },
      { width: 600, height: 600, crop: 'fill' }
    ],
    eager_async: true,
    eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL
  }
});





// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    return cb(null, true);
  }
  
  cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'));
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 5 * 1024 * 1024 // 5MB default
  }
});

// Middleware for single file upload
const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file'
      });
    }
    next();
  });
};

// Middleware for multiple file uploads (for gallery)
const uploadGalleryImages = (req, res, next) => {
  upload.array('gallery', 5)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading files'
      });
    }
    next();
  });
};

module.exports = {
  uploadSingleImage,
  uploadGalleryImages,
  cloudinary // Export cloudinary for direct use if needed
};