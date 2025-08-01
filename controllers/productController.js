const Product = require('../models/Product');
const { uploadSingleImage, uploadGalleryImages, cloudinary } = require('../middleware/multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Utility function to delete image from Cloudinary
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'clothing-store';
    const fullPublicId = `${folder}/${publicId}`;
    
    const result = await cloudinary.uploader.destroy(fullPublicId);
    console.log(`Deleted image from Cloudinary: ${fullPublicId}`, result.result);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw error to prevent blocking the main operation
  }
};

// Utility function to optimize Cloudinary URLs
const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || !url.includes('cloudinary')) return url;
  
  try {
    const { width, height, crop = 'fill', quality = 'auto:good' } = options;
    const baseUrl = url.split('/upload/')[0] + '/upload/';
    const path = url.split('/upload/')[1];
    
    if (!path) return url; // If no path found, return original URL
    
    let transformations = `f_auto,q_auto:good`;
    if (width && height) {
      transformations += `,w_${width},h_${height},c_${crop}`;
    }
    
    return `${baseUrl}${transformations}/${path}`;
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error, 'Original URL:', url);
    return url; // Return original URL if optimization fails
  }
};

// @desc    Get admin dashboard
// @route   GET /admin/dashboard
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin/index', { 
      title: 'Admin Dashboard',
      products,
      success: req.query.success || null
    });
  } catch (error) {
    res.status(500).render('error', { 
      message: 'Server Error',
      error: { status: 500 }
    });
  }
};

// @desc    Create a new product (for traditional form submission)
// @route   POST /admin/add-product
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { title, price, category, description, discountAmount = 0, discountPercentage = 0 } = req.body;

    // Sizes: ensure array
    let sizes = req.body.sizes || [];
    if (!Array.isArray(sizes)) sizes = [sizes];

    // Prepare form data for re-rendering in case of errors
    const formData = {
      title,
      description,
      price,
      category,
      discountAmount,
      discountPercentage,
      sizes
    };

    // Basic validation
    if (!title || !price || !category || !description || sizes.length === 0) {
      return res.status(400).render('admin/add-product', {
        title: 'Add Product',
        error: 'Please fill in all required fields and select at least one size',
        formData
      });
    }

    // Check if files were uploaded
    if (!req.files || !req.files.length) {
      return res.status(400).render('admin/add-product', {
        title: 'Add Product',
        error: 'Please upload at least one product image',
        formData
      });
    }

    // Create product with Cloudinary URLs
    const gallery = req.files.map(file => file.path); // Cloudinary provides path
    
    const product = new Product({
      title,
      price: parseFloat(price),
      srcUrl: gallery[0], // First image as main image
      gallery,
      category,
      sizes,
      description,
      discount: {
        amount: parseFloat(discountAmount) || 0,
        percentage: parseFloat(discountPercentage) || 0
      },
      rating: 0 // Default rating
    });

    await product.save();
    res.redirect('/admin/dashboard?success=Product added successfully');
  } catch (error) {
    // If there were files uploaded but an error occurred, delete them from Cloudinary
    if (req.files) {
      try {
        await Promise.all(
          req.files.map(file => deleteCloudinaryImage(file.path))
        );
      } catch (cloudinaryError) {
        console.error('Error cleaning up Cloudinary files:', cloudinaryError);
      }
    }
    
    // Prepare form data for re-rendering
    const formData = {
      title: req.body.title || '',
      description: req.body.description || '',
      price: req.body.price || '',
      category: req.body.category || '',
      discountAmount: req.body.discountAmount || '0',
      discountPercentage: req.body.discountPercentage || '0',
      sizes: req.body.sizes || []
    };
    
    res.status(500).render('admin/add-product', {
      title: 'Add Product',
      error: 'Error adding product. Please try again.',
      formData
    });
  }
};

// @desc    Get all products (with filtering, sorting, pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    // Filters
    const { category, size, minPrice, maxPrice, sort = '-createdAt', page = 1, limit = 12, search, exclude } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (size) query.sizes = size;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (exclude) {
      const excludeIds = Array.isArray(exclude) ? exclude : [exclude];
      const objectIds = excludeIds.filter(id => {
        try {
          mongoose.Types.ObjectId(id);
          return true;
        } catch (error) {
          return false;
        }
      }).map(id => mongoose.Types.ObjectId(id));
      
      if (objectIds.length > 0) {
        query._id = { $nin: objectIds };
      }
    }
    
    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting
    let sortObj = {};
    if (sort === 'price-asc') sortObj.price = 1;
    else if (sort === 'price-desc') sortObj.price = -1;
    else if (sort === 'newest') sortObj.createdAt = -1;
    else if (sort === 'oldest') sortObj.createdAt = 1;
    else sortObj = { createdAt: -1 };
    
    // Query
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);
    
    // Return products without URL optimization to fix image display
    const optimizedProducts = products.map(product => {
      const optimizedProduct = product.toObject();
      // Keep original URLs to ensure they work
      // console.log('Product:', optimizedProduct.title, 'srcUrl:', optimizedProduct.srcUrl);
      return optimizedProduct;
    });
      
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: optimizedProducts
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Optimize image URLs for better performance
    const optimizedProduct = product.toObject();
    if (optimizedProduct.srcUrl) {
      optimizedProduct.srcUrl = optimizeCloudinaryUrl(optimizedProduct.srcUrl, { width: 800, height: 800 });
    }
    if (optimizedProduct.gallery && optimizedProduct.gallery.length > 0) {
      optimizedProduct.gallery = optimizedProduct.gallery.map(url => 
        optimizeCloudinaryUrl(url, { width: 400, height: 400 })
      );
    }
    
    res.status(200).json({
      success: true,
      data: optimizedProduct
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Delete images from Cloudinary
    try {
      // Delete main image
      if (product.srcUrl) {
        await deleteCloudinaryImage(product.srcUrl);
      }
      
      // Delete gallery images
      if (product.gallery && product.gallery.length > 0) {
        await Promise.all(
          product.gallery.map(imageUrl => deleteCloudinaryImage(imageUrl))
        );
      }
    } catch (cloudinaryError) {
      console.error('Error deleting images from Cloudinary:', cloudinaryError);
      // Continue with product deletion even if image deletion fails
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Render edit product page
// @route   GET /admin/edit-product/:id
// @access  Private/Admin
exports.editProductPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found', error: { status: 404 } });
    }
    res.render('admin/edit-product', {
      title: 'Edit Product',
      error: null,
      formData: {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        discountAmount: product.discount?.amount || 0,
        discountPercentage: product.discount?.percentage || 0,
        srcUrl: product.srcUrl,
        gallery: product.gallery || [],
        sizes: product.sizes
      },
      productId: product._id
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Server Error', error: { status: 500 } });
  }
};

// @desc    Update product
// @route   POST /admin/edit-product/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { title, price, category, description, discountAmount = 0, discountPercentage = 0 } = req.body;
    let sizes = req.body.sizes || [];
    if (!Array.isArray(sizes)) sizes = [sizes];
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found', error: { status: 404 } });
    }
    
    // Store old images for cleanup if needed
    const oldMainImage = product.srcUrl;
    const oldGallery = [...product.gallery];
    
    // Update fields
    product.title = title;
    product.price = parseFloat(price);
    product.category = category;
    product.description = description;
    product.sizes = sizes;
    product.discount = {
      amount: parseFloat(discountAmount) || 0,
      percentage: parseFloat(discountPercentage) || 0
    };
    
    // Handle new images
    if (req.files && req.files.length) {
      // Add new images to gallery
      const newImages = req.files.map(file => file.path);
      product.gallery = [...newImages, ...product.gallery.filter(img => img !== product.srcUrl)];
      product.srcUrl = newImages[0]; // Set first new image as main image
    }
    
    await product.save();
    
    // Cleanup old images if they're no longer referenced
    if (req.files && req.files.length) {
      try {
        // Delete old main image if it's no longer in the gallery
        if (oldMainImage && !product.gallery.includes(oldMainImage)) {
          await deleteCloudinaryImage(oldMainImage);
        }
        
        // Delete any old gallery images that were removed
        const imagesToDelete = oldGallery.filter(
          img => img !== oldMainImage && !product.gallery.includes(img)
        );
        
        await Promise.all(
          imagesToDelete.map(img => deleteCloudinaryImage(img))
        );
      } catch (cloudinaryError) {
        console.error('Error cleaning up old images:', cloudinaryError);
      }
    }
    
    res.redirect('/admin/dashboard?success=Product updated successfully');
  } catch (error) {
    // If there were files uploaded but an error occurred, delete them from Cloudinary
    if (req.files) {
      try {
        await Promise.all(
          req.files.map(file => deleteCloudinaryImage(file.path))
        );
      } catch (cloudinaryError) {
        console.error('Error cleaning up Cloudinary files:', cloudinaryError);
      }
    }
    
    // Re-render the edit form with previous values and error message
    res.status(500).render('admin/edit-product', {
      title: 'Edit Product',
      error: 'Error updating product. Please try again.',
      formData: req.body,
      productId: req.params.id
    });
  }
};