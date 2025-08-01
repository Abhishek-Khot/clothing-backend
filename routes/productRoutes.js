const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getProducts, 
  getProduct,
  deleteProduct,
  getAdminDashboard,
  addProductPage,
  editProductPage,
  updateProduct
} = require('../controllers/productController');
const { uploadGalleryImages } = require('../middleware/multer');

// Admin dashboard
router.get('/admin/dashboard', async (req, res, next) => {
  try {
    await getAdminDashboard(req, res);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      message: 'Server Error',
      error: { status: 500 }
    });
  }
});

// Admin add product page (GET and POST)
router.route('/admin/add-product')
  .get((req, res) => {
    res.render('admin/add-product', { 
      title: 'Add Product',
      error: null,
      formData: {}
    });
  })
  .post(uploadGalleryImages, async (req, res, next) => {
    try {
      await createProduct(req, res);
    } catch (error) {
      console.error('Error in form submission:', error);
      
      // Clean up any uploaded images if error occurred
      if (req.files && req.files.length) {
        try {
          const { cloudinary } = require('../middleware/multer');
          await Promise.all(
            req.files.map(file => 
              cloudinary.uploader.destroy(file.filename)
            )
          );
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded images:', cleanupError);
        }
      }
      
      res.status(500).render('admin/add-product', {
        title: 'Add Product',
        error: 'Error adding product. Please try again.',
        formData: req.body
      });
    }
  });

// Admin edit product page (GET and POST)
router.route('/admin/edit-product/:id')
  .get(async (req, res, next) => {
    try {
      await editProductPage(req, res);
    } catch (error) {
      console.error('Edit page error:', error);
      res.status(500).render('error', { 
        message: 'Server Error',
        error: { status: 500 }
      });
    }
  })
  .post(uploadGalleryImages, async (req, res, next) => {
    try {
      await updateProduct(req, res);
    } catch (error) {
      console.error('Error updating product:', error);
      
      // Clean up any newly uploaded images if error occurred
      if (req.files && req.files.length) {
        try {
          const { cloudinary } = require('../middleware/multer');
          await Promise.all(
            req.files.map(file => 
              cloudinary.uploader.destroy(file.filename)
            )
          );
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded images:', cleanupError);
        }
      }
      
      res.status(500).render('admin/edit-product', {
        title: 'Edit Product',
        error: 'Error updating product. Please try again.',
        formData: req.body,
        productId: req.params.id
      });
    }
  });

// API Routes
router.get('/products', async (req, res, next) => {
  try {
    await getProducts(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    await getProduct(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await deleteProduct(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
