# Clothing Store Backend

A Node.js/Express backend for a clothing store with Cloudinary image management.

## Issues Fixed

### 1. Route Handler Error
- **Problem**: `TypeError: argument handler must be a function` at line 63 in server.js
- **Root Cause**: Conflicting route definitions between server.js and productRoutes.js
- **Solution**: Removed duplicate route definitions from server.js and centralized all routes in productRoutes.js

### 2. Missing Import
- **Problem**: Missing `path` module import in multer.js
- **Solution**: Added `const path = require('path');` to multer.js

### 3. Cloudinary Integration Improvements
- Enhanced Cloudinary configuration with better image optimization
- Added automatic image transformations and eager loading
- Improved error handling for image uploads and deletions
- Added URL optimization for better performance

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
```

### 3. Start the Server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### Admin Routes
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/add-product` - Add product page
- `POST /admin/add-product` - Create new product
- `GET /admin/edit-product/:id` - Edit product page
- `POST /admin/edit-product/:id` - Update product

### API Routes
- `GET /api/products` - Get all products (with filtering, sorting, pagination)
- `GET /api/products/:id` - Get single product
- `DELETE /api/products/:id` - Delete product

## Cloudinary Features

### Image Optimization
- Automatic image compression and format optimization
- Multiple size variants (thumbnails, medium, large)
- Eager loading for better performance
- Automatic cleanup of unused images

### Upload Configuration
- Maximum file size: 5MB
- Supported formats: JPG, JPEG, PNG, WebP
- Automatic image transformations
- Folder organization in Cloudinary

## Error Handling

- Comprehensive error handling for image uploads
- Automatic cleanup of uploaded images on errors
- Graceful degradation when Cloudinary operations fail
- Detailed error logging for debugging

## Performance Optimizations

- Optimized Cloudinary URLs for different use cases
- Automatic image format and quality optimization
- Efficient image deletion with proper error handling
- Pagination and filtering for large datasets 
