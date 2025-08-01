const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  percentage: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Please add a title'] 
  },
  srcUrl: { 
    type: String, 
    required: [true, 'Please add an image URL'] 
  },
  gallery: {
    type: [String],
    default: []
  },
  sizes: {
    type: [String],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    required: true,
    default: []
  },
  price: { 
    type: Number, 
    required: [true, 'Please add a price'] 
  },
  discount: {
    type: discountSchema,
    default: { amount: 0, percentage: 0 }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['T-shirts', 'Shorts', 'Shirts', 'Hoodie', 'Jeans']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
