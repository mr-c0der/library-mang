const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { direction, isPaid } = req.query;
    let query = {};
    if (direction) query.direction = direction;
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';
    const debts = await Debt.find(query).sort({ date: -1 });
    res.json(debts);
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const debt = new Debt(req.body);
    await debt.save();
    res.status(201).json(debt);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(debt);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Debt.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الدين' });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

module.exports = router;
