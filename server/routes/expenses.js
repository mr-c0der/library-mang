const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { type, category } = req.query;
    let query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف المصروف' });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

module.exports = router;
