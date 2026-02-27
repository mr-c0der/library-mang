const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['أجهزة كمبيوتر', 'أثاث', 'معدات', 'مركبات', 'أخرى'],
    required: true
  },
  purchasePrice: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  quantity: { type: Number, default: 1 },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);
