const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const Sale = require('../models/Sale');
const Rental = require('../models/Rental');
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Debt = require('../models/Debt');
const auth = require('../middleware/auth');

router.get('/excel', auth, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'نظام إدارة المكتبة';
    workbook.created = new Date();

    const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a5c' } }, alignment: { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };
    const rowStyle = { alignment: { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };

    const applyStyle = (row, style) => { row.eachCell(cell => Object.assign(cell, style)); row.height = 25; };

    // Sheet 1: Sales
    const salesSheet = workbook.addWorksheet('المبيعات', { views: [{ rightToLeft: true }] });
    salesSheet.columns = [
      { header: 'رقم', key: 'num', width: 8 },
      { header: 'اسم العميل', key: 'customer', width: 20 },
      { header: 'الكتاب', key: 'book', width: 25 },
      { header: 'الكمية', key: 'qty', width: 10 },
      { header: 'المبلغ (جنيه)', key: 'amount', width: 15 },
      { header: 'حالة الدفع', key: 'paid', width: 12 },
      { header: 'التاريخ', key: 'date', width: 15 }
    ];
    applyStyle(salesSheet.getRow(1), headerStyle);
    const sales = await Sale.find().populate('customer', 'name').populate('book', 'title');
    sales.forEach((s, i) => {
      const row = salesSheet.addRow({ num: i + 1, customer: s.customer?.name || '-', book: s.book?.title || '-', qty: s.quantity, amount: s.totalAmount, paid: s.isPaid ? 'مدفوع' : 'غير مدفوع', date: new Date(s.saleDate).toLocaleDateString('ar-EG') });
      applyStyle(row, rowStyle);
      if (!s.isPaid) row.getCell('paid').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
    });
    salesSheet.addRow([]);
    const salesTotal = salesSheet.addRow(['', '', '', 'الإجمالي:', sales.reduce((s, x) => s + x.totalAmount, 0).toFixed(2), '', '']);
    salesTotal.font = { bold: true }; salesTotal.getCell(4).alignment = { horizontal: 'right' };

    // Sheet 2: Rentals
    const rentSheet = workbook.addWorksheet('التأجيرات', { views: [{ rightToLeft: true }] });
    rentSheet.columns = [
      { header: 'رقم', key: 'num', width: 8 },
      { header: 'اسم العميل', key: 'customer', width: 20 },
      { header: 'الكتاب', key: 'book', width: 25 },
      { header: 'مدة التأجير (أيام)', key: 'days', width: 18 },
      { header: 'المبلغ (جنيه)', key: 'amount', width: 15 },
      { header: 'غرامة التأخير', key: 'late', width: 15 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'تاريخ الإرجاع', key: 'due', width: 15 }
    ];
    applyStyle(rentSheet.getRow(1), headerStyle);
    const rentals = await Rental.find().populate('customer', 'name').populate('book', 'title');
    rentals.forEach((r, i) => {
      const row = rentSheet.addRow({ num: i + 1, customer: r.customer?.name || '-', book: r.book?.title || '-', days: r.durationDays, amount: r.totalAmount, late: r.lateFee || 0, status: r.status, due: new Date(r.dueDate).toLocaleDateString('ar-EG') });
      applyStyle(row, rowStyle);
      if (r.status === 'متأخر') row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
    });

    // Sheet 3: Expenses
    const expSheet = workbook.addWorksheet('المصروفات', { views: [{ rightToLeft: true }] });
    expSheet.columns = [
      { header: 'رقم', key: 'num', width: 8 },
      { header: 'البند', key: 'title', width: 25 },
      { header: 'الفئة', key: 'cat', width: 15 },
      { header: 'النوع', key: 'type', width: 12 },
      { header: 'المبلغ (جنيه)', key: 'amount', width: 15 },
      { header: 'التاريخ', key: 'date', width: 15 }
    ];
    applyStyle(expSheet.getRow(1), headerStyle);
    const expenses = await Expense.find();
    expenses.forEach((e, i) => {
      const row = expSheet.addRow({ num: i + 1, title: e.title, cat: e.category, type: e.type, amount: e.amount, date: new Date(e.date).toLocaleDateString('ar-EG') });
      applyStyle(row, rowStyle);
    });

    // Sheet 4: Employees
    const empSheet = workbook.addWorksheet('الموظفون', { views: [{ rightToLeft: true }] });
    empSheet.columns = [
      { header: 'رقم', key: 'num', width: 8 },
      { header: 'الاسم', key: 'name', width: 20 },
      { header: 'المنصب', key: 'pos', width: 20 },
      { header: 'الراتب (جنيه)', key: 'salary', width: 15 },
      { header: 'الهاتف', key: 'phone', width: 15 }
    ];
    applyStyle(empSheet.getRow(1), headerStyle);
    const employees = await Employee.find();
    employees.forEach((e, i) => {
      const row = empSheet.addRow({ num: i + 1, name: e.name, pos: e.position, salary: e.salary, phone: e.phone });
      applyStyle(row, rowStyle);
    });

    // Sheet 5: Financial Summary
    const summarySheet = workbook.addWorksheet('الملخص المالي', { views: [{ rightToLeft: true }] });
    summarySheet.columns = [{ header: 'البند', key: 'item', width: 30 }, { header: 'المبلغ (جنيه)', key: 'amount', width: 20 }];
    applyStyle(summarySheet.getRow(1), headerStyle);
    const totalSalesRev = sales.filter(s => s.isPaid).reduce((t, s) => t + s.totalAmount, 0);
    const totalRentalRev = rentals.filter(r => r.isPaid).reduce((t, r) => t + r.totalAmount, 0);
    const totalLateFees = rentals.reduce((t, r) => t + (r.lateFee || 0), 0);
    const totalExpAmt = expenses.reduce((t, e) => t + e.amount, 0);
    const totalSalaries = employees.reduce((t, e) => t + e.salary, 0);
    const netProfit = (totalSalesRev + totalRentalRev + totalLateFees) - (totalExpAmt + totalSalaries);
    const summaryRows = [
      ['إيرادات المبيعات', totalSalesRev.toFixed(2)],
      ['إيرادات التأجير', totalRentalRev.toFixed(2)],
      ['غرامات التأخير', totalLateFees.toFixed(2)],
      ['إجمالي الإيرادات', (totalSalesRev + totalRentalRev + totalLateFees).toFixed(2)],
      ['---', '---'],
      ['المصروفات التشغيلية', totalExpAmt.toFixed(2)],
      ['إجمالي الرواتب', totalSalaries.toFixed(2)],
      ['إجمالي المصروفات', (totalExpAmt + totalSalaries).toFixed(2)],
      ['---', '---'],
      ['صافي الربح', netProfit.toFixed(2)]
    ];
    summaryRows.forEach(([item, amount]) => {
      const row = summarySheet.addRow({ item, amount });
      applyStyle(row, rowStyle);
      if (item === 'صافي الربح') { row.font = { bold: true, size: 13, color: { argb: netProfit >= 0 ? 'FF006400' : 'FFCC0000' } }; row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: netProfit >= 0 ? 'FFe6ffe6' : 'FFffe6e6' } }; }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('تقرير_المكتبة_' + new Date().toLocaleDateString('en-GB').replace(/\//g, '-'))}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في إنشاء الملف' });
  }
});

module.exports = router;
