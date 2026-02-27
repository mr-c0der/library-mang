const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  rentalDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
  durationDays: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  lateFee: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  status: { type: String, enum: ['نشط', 'مُرجَع', 'متأخر'], default: 'نشط' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Auto-calculate late fee before saving
RentalSchema.pre('save', function(next) {
  if (this.returnDate && this.returnDate > this.dueDate) {
    const daysLate = Math.ceil((this.returnDate - this.dueDate) / (1000 * 60 * 60 * 24));
    this.lateFee = daysLate * this.pricePerDay * 0.5;
  }
  if (!this.returnDate && new Date() > this.dueDate) {
    this.status = 'متأخر';
  }
  next();
});

module.exports = mongoose.model('Rental', RentalSchema);
