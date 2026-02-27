const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Build MONGO_URI manually to safely encode special chars in password
if (!process.env.MONGO_URI_OVERRIDE) {
  const user = encodeURIComponent('managementsystem');
  const pass = encodeURIComponent('Mis@20262026');
  process.env.MONGO_URI = `mongodb+srv://${user}:${pass}@laibrarymanagementsyste.qd0qhnx.mongodb.net/?appName=LaibraryManagementSystem`;
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/debts', require('./routes/debts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/export', require('./routes/export'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ تم الاتصال بـ MongoDB Atlas بنجاح');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`));
  })
  .catch(err => {
    console.error('❌ فشل الاتصال بـ MongoDB:', err.message);
    process.exit(1);
  });
