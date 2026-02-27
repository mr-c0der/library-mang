const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غلط' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غلط' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// POST /api/auth/setup - إنشاء حساب المدير (مرة واحدة فقط)
router.post('/setup', async (req, res) => {
  try {
    const exists = await User.findOne({});
    if (exists) return res.status(400).json({ message: 'المدير موجود بالفعل' });
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    res.json({ message: 'تم إنشاء حساب المدير بنجاح' });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

router.get('/check', async (req, res) => {
  const exists = await User.findOne({});
  res.json({ hasAdmin: !!exists });
});

module.exports = router;
