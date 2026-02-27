const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: {
    type: String,
    enum: ['تعليمي', 'أدب', 'قصص أطفال', 'ديني', 'علمي', 'تاريخ', 'رواية', 'أخرى'],
    required: true
  },
  salePrice: { type: Number, default: 0 },
  rentalPricePerDay: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  description: { type: String, default: '' },
  isAvailableForSale: { type: Boolean, default: true },
  isAvailableForRental: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
