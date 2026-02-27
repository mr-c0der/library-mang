const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Debt = require('../models/Debt');
const Customer = require('../models/Customer');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

// Financial Summary
router.get('/summary', auth, async (req, res) => {
  try {
    const sales = await Sale.find();
    const rentals = await Rental.find();
    const expenses = await Expense.find();
    const employees = await Employee.find({ isActive: true });
    const debts = await Debt.find({ isPaid: false });

    const salesRevenue = sales.filter(s => s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0);
    const rentalRevenue = rentals.filter(r => r.isPaid).reduce((sum, r) => sum + r.totalAmount, 0);
    const lateFeeRevenue = rentals.reduce((sum, r) => sum + (r.lateFee || 0), 0);
    const totalRevenue = salesRevenue + rentalRevenue + lateFeeRevenue;

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);
    const totalExpensesWithSalaries = totalExpenses + totalSalaries;

    const netProfit = totalRevenue - totalExpensesWithSalaries;

    const unpaidSales = sales.filter(s => !s.isPaid).reduce((sum, s) => sum + s.totalAmount, 0);
    const unpaidRentals = rentals.filter(r => !r.isPaid).reduce((sum, r) => sum + r.totalAmount, 0);
    const pendingLateFees = rentals.filter(r => r.status === 'متأخر' && !r.isPaid).reduce((sum, r) => sum + (r.lateFee || 0), 0);

    const debtsOwedToMe = debts.filter(d => d.direction === 'لي').reduce((sum, d) => sum + d.amount, 0);
    const debtsOwedByMe = debts.filter(d => d.direction === 'علي').reduce((sum, d) => sum + d.amount, 0);

    const activeRentals = rentals.filter(r => r.status === 'نشط').length;
    const overdueRentals = rentals.filter(r => r.status === 'متأخر').length;

    res.json({
      revenue: { sales: salesRevenue, rentals: rentalRevenue, lateFees: lateFeeRevenue, total: totalRevenue },
      expenses: { operations: totalExpenses, salaries: totalSalaries, total: totalExpensesWithSalaries },
      netProfit,
      pending: { unpaidSales, unpaidRentals, pendingLateFees },
      debts: { owedToMe: debtsOwedToMe, owedByMe: debtsOwedByMe },
      stats: { activeRentals, overdueRentals, totalSales: sales.length, totalRentals: rentals.length }
    });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

// Demographics
router.get('/demographics', auth, async (req, res) => {
  try {
    const customers = await Customer.find();
    const maleCount = customers.filter(c => c.gender === 'ذكر').length;
    const femaleCount = customers.filter(c => c.gender === 'أنثى').length;

    const ageGroups = { 'أقل من 18': 0, '18-25': 0, '26-35': 0, '36-50': 0, 'أكثر من 50': 0 };
    customers.forEach(c => {
      if (c.age < 18) ageGroups['أقل من 18']++;
      else if (c.age <= 25) ageGroups['18-25']++;
      else if (c.age <= 35) ageGroups['26-35']++;
      else if (c.age <= 50) ageGroups['36-50']++;
      else ageGroups['أكثر من 50']++;
    });

    res.json({ gender: { male: maleCount, female: femaleCount }, ageGroups });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

// Top Books
router.get('/top-books', auth, async (req, res) => {
  try {
    const topSold = await Sale.aggregate([
      { $group: { _id: '$book', totalSold: { $sum: '$quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' }
    ]);
    const topRented = await Rental.aggregate([
      { $group: { _id: '$book', totalRented: { $sum: 1 } } },
      { $sort: { totalRented: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' }
    ]);
    const categoryStats = await Sale.aggregate([
      { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $group: { _id: '$book.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ topSold, topRented, categoryStats });
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

// Monthly revenue chart data
router.get('/monthly', auth, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const months = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0);
      const salesRev = await Sale.aggregate([
        { $match: { saleDate: { $gte: start, $lte: end }, isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const rentalRev = await Rental.aggregate([
        { $match: { rentalDate: { $gte: start, $lte: end }, isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const exp = await Expense.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      months.push({
        month: m + 1,
        revenue: (salesRev[0]?.total || 0) + (rentalRev[0]?.total || 0),
        expenses: exp[0]?.total || 0
      });
    }
    res.json(months);
  } catch (err) { res.status(500).json({ message: 'خطأ في الخادم' }); }
});

module.exports = router;
