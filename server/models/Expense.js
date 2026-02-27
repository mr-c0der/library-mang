const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['ثابت', 'متغير'], required: true },
  category: {
    type: String,
    enum: ['راتب موظف', 'كهرباء', 'مياه', 'إنترنت', 'شراء كتب', 'إيجار', 'صيانة', 'أخرى'],
    required: true
  },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
