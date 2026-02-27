const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer', 'name phone')
      .populate('book', 'title category')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();
    // Decrease stock
    await Book.findByIdAndUpdate(req.body.book, { $inc: { stock: -req.body.quantity } });
    const populated = await sale.populate(['customer', 'book']);
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('customer', 'name phone')
      .populate('book', 'title category');
    res.json(sale);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف عملية البيع' });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

module.exports = router;
