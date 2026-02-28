const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Use MONGO_URI from environment (Vercel dashboard or .env file)
// Fallback: build URI from parts for local dev
const MONGO_URI = process.env.MONGO_URI || (() => {
  const user = encodeURIComponent('managementsystem');
  const pass = encodeURIComponent('MiS20262026');
  return `mongodb+srv://${user}:${pass}@laibrarymanagementsyste.qd0qhnx.mongodb.net/librarydb?retryWrites=true&w=majority&authSource=admin&appName=LaibraryManagementSystem`;
})();

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

// Connect to MongoDB (cached for serverless)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log('✅ تم الاتصال بـ MongoDB Atlas');
};

// Middleware to ensure DB connection on each request (serverless-safe)
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { res.status(500).json({ message: 'فشل الاتصال بقاعدة البيانات' }); }
});

// Export for Vercel serverless
module.exports = app;

// Start server locally (only when not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`));
  }).catch(err => {
    console.error('❌ فشل الاتصال بـ MongoDB:', err.message);
    process.exit(1);
  });
}
