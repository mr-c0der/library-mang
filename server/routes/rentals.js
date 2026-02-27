const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const rentals = await Rental.find(query)
      .populate('customer', 'name phone')
      .populate('book', 'title category')
      .sort({ createdAt: -1 });
    // Auto-update overdue
    const now = new Date();
    rentals.forEach(r => {
      if (!r.returnDate && r.dueDate < now && r.status === 'نشط') {
        r.status = 'متأخر';
      }
    });
    res.json(rentals);
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const rental = new Rental(req.body);
    await rental.save();
    await Book.findByIdAndUpdate(req.body.book, { $inc: { stock: -1 } });
    const populated = await Rental.findById(rental._id)
      .populate('customer', 'name phone')
      .populate('book', 'title category');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Return a book
router.put('/:id/return', auth, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ message: 'التأجير غير موجود' });
    rental.returnDate = new Date();
    rental.status = 'مُرجَع';
    if (rental.returnDate > rental.dueDate) {
      const daysLate = Math.ceil((rental.returnDate - rental.dueDate) / (1000 * 60 * 60 * 24));
      rental.lateFee = daysLate * rental.pricePerDay * 0.5;
    }
    await rental.save();
    await Book.findByIdAndUpdate(rental.book, { $inc: { stock: 1 } });
    res.json(rental);
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const rental = await Rental.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('customer', 'name phone')
      .populate('book', 'title category');
    res.json(rental);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف التأجير' });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

module.exports = router;
