const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
  party: { type: String, required: true },
  amount: { type: Number, required: true },
  direction: { type: String, enum: ['لي', 'علي'], required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date, default: null },
  isPaid: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Debt', DebtSchema);
