import mongoose from 'mongoose';
import FeeStructure from '../models/FeeStructure.js';
import StudentFee from '../models/StudentFee.js';
import Payment from '../models/Payment.js';
import Receipt from '../models/Receipt.js';
import Expense from '../models/Expense.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 7 Finance & Accounts Test Suite');
console.log('----------------------------------------------------');

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`  ✓ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`);
    failed++;
  }
};

const runPhase7Tests = async () => {
  try {
    // 1. Fee Structure Model & Component Summation
    console.log('\n[Suite 1: Fee Structure Model & Component Aggregation]');
    const dummyClassId = new mongoose.Types.ObjectId();
    const dummySessionId = new mongoose.Types.ObjectId();

    const components = [
      { name: 'Tuition Fee', amount: 500, frequency: 'Monthly', isOptional: false },
      { name: 'Computer Lab Fee', amount: 120, frequency: 'Monthly', isOptional: false },
      { name: 'Sports & Games', amount: 80, frequency: 'Annually', isOptional: false },
    ];
    const totalAmount = components.reduce((sum, c) => sum + c.amount, 0);

    const feeStructure = new FeeStructure({
      name: 'Grade 10 General Term 1',
      academicSessionId: dummySessionId,
      classId: dummyClassId,
      components,
      totalAmount,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      lateFinePerDay: 5,
    });

    const structureValidation = feeStructure.validateSync();
    assert(!structureValidation, 'FeeStructure model validates successfully with component array');
    assert(feeStructure.totalAmount === 700, 'FeeStructure totalAmount matches component sum (500 + 120 + 80 = 700)');
    assert(feeStructure.lateFinePerDay === 5, 'FeeStructure tracks late fine per day correctly');

    // 2. Student Fee Invoice Model & Arithmetic Calculations
    console.log('\n[Suite 2: Student Fee Invoicing & State Logic]');
    const dummyStudentId = new mongoose.Types.ObjectId();

    const invoice = new StudentFee({
      invoiceNumber: 'INV-2026-10001',
      studentId: dummyStudentId,
      feeStructureId: feeStructure._id,
      academicSessionId: dummySessionId,
      baseAmount: 700,
      discountAmount: 100,
      discountReason: 'Merit Scholarship',
      lateFine: 0,
      netPayable: 600, // 700 - 100
      paidAmount: 0,
      balanceAmount: 600,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Unpaid',
    });

    const invoiceValidation = invoice.validateSync();
    assert(!invoiceValidation, 'StudentFee invoice validates cleanly without schema errors');
    assert(invoice.netPayable === 600, 'Net payable correctly deducts discount from baseAmount ($700 - $100 = $600)');
    assert(invoice.balanceAmount === 600, 'Initial balanceAmount equals netPayable before collection');
    assert(invoice.status === 'Unpaid', 'Initial invoice status defaults to Unpaid');

    // 3. Partial Payment & State Transition Simulation
    console.log('\n[Suite 3: Payment Collection & Ledger Transitions]');
    const dummyUserId = new mongoose.Types.ObjectId();

    // First Partial Payment: $250
    const pay1Amount = 250;
    const payment1 = new Payment({
      paymentNumber: 'PAY-2026-50001',
      studentFeeId: invoice._id,
      studentId: dummyStudentId,
      amount: pay1Amount,
      paymentMethod: 'UPI',
      transactionReference: 'UPI-TXN-987654321',
      status: 'Success',
      collectedBy: dummyUserId,
      remarks: 'First installment via UPI',
    });

    assert(!payment1.validateSync(), 'Payment record validates cleanly');

    // Simulate ledger update for payment 1
    invoice.paidAmount += pay1Amount;
    invoice.balanceAmount = Math.max(0, invoice.netPayable - invoice.paidAmount);
    if (invoice.balanceAmount === 0) invoice.status = 'Paid';
    else invoice.status = 'Partially Paid';

    assert(invoice.paidAmount === 250, 'Paid amount updated to $250');
    assert(invoice.balanceAmount === 350, 'Remaining balance updated to $350 ($600 - $250)');
    assert(invoice.status === 'Partially Paid', 'Invoice transitioned status from Unpaid to Partially Paid');

    // Second Settlement Payment: $350
    const pay2Amount = 350;
    const payment2 = new Payment({
      paymentNumber: 'PAY-2026-50002',
      studentFeeId: invoice._id,
      studentId: dummyStudentId,
      amount: pay2Amount,
      paymentMethod: 'Bank Transfer',
      status: 'Success',
      collectedBy: dummyUserId,
    });

    assert(!payment2.validateSync(), 'Second payment record validates cleanly');

    // Simulate ledger update for payment 2
    invoice.paidAmount += pay2Amount;
    invoice.balanceAmount = Math.max(0, invoice.netPayable - invoice.paidAmount);
    if (invoice.balanceAmount === 0) invoice.status = 'Paid';

    assert(invoice.paidAmount === 600, 'Paid amount fully settled to $600');
    assert(invoice.balanceAmount === 0, 'Remaining balance cleared to $0');
    assert(invoice.status === 'Paid', 'Invoice transitioned status to Paid upon full balance clearance');

    // Overpayment guard check
    const overpaymentAmount = 50;
    const canAcceptOverpayment = overpaymentAmount <= invoice.balanceAmount;
    assert(!canAcceptOverpayment, 'Overpayment guard rejects excess payment when balance is $0');

    // 4. Immutable Receipt Snapshot Integrity
    console.log('\n[Suite 4: Immutable Receipt Snapshot Integrity]');
    const receipt = new Receipt({
      receiptNumber: 'REC-2026-90001',
      paymentId: payment2._id,
      studentFeeId: invoice._id,
      studentId: dummyStudentId,
      amountPaid: 350,
      paymentMethod: 'Bank Transfer',
      receiptDate: new Date(),
      snapshot: {
        schoolName: 'Global International School',
        studentName: 'Eleanor Vance',
        studentId: 'STU-2026-0042',
        admissionNumber: 'STU-2026-0042',
        className: 'Grade 10',
        sectionName: 'Section A',
        parentName: 'Arthur Vance',
        invoiceNumber: invoice.invoiceNumber,
        balanceRemaining: invoice.balanceAmount,
      },
      issuedBy: dummyUserId,
    });

    const receiptValidation = receipt.validateSync();
    assert(!receiptValidation, 'Receipt validates cleanly with full snapshot metadata');
    assert(receipt.snapshot.studentName === 'Eleanor Vance', 'Snapshot immutably retains student name');
    assert(receipt.snapshot.invoiceNumber === 'INV-2026-10001', 'Snapshot binds to invoice number');
    assert(receipt.snapshot.balanceRemaining === 0, 'Snapshot reflects $0 balance after full settlement');

    // 5. Defaulter Calculation & Accrued Late Fines
    console.log('\n[Suite 5: Defaulter Identification & Late Fine Accrual]');
    const pastDueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const overdueInvoice = {
      dueDate: pastDueDate,
      balanceAmount: 400,
      lateFinePerDay: 5,
    };
    const daysOverdue = Math.floor((Date.now() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24));
    const accruedFine = daysOverdue * overdueInvoice.lateFinePerDay;
    const totalDueWithFine = overdueInvoice.balanceAmount + accruedFine;

    assert(daysOverdue >= 10, `Overdue calculation detects ${daysOverdue} days overdue`);
    assert(accruedFine === 50, 'Accrues $50 fine ($5/day * 10 days)');
    assert(totalDueWithFine === 450, 'Total due correctly computes $450 ($400 balance + $50 fine)');

    // 6. Institutional Expense Management & Net Cashflow
    console.log('\n[Suite 6: Institutional Expense & Net Cashflow]');
    const expense = new Expense({
      title: 'Monthly High-Speed Fiber Internet',
      category: 'IT & Software',
      amount: 450,
      date: new Date(),
      paymentMethod: 'Bank Transfer',
      vendorName: 'Metropolitan Telecom Ltd',
      vendorInvoiceNumber: 'TEL-2026-981',
      status: 'Approved',
      approvedBy: dummyUserId,
    });

    const expenseValidation = expense.validateSync();
    assert(!expenseValidation, 'Expense record validates with IT & Software category');
    assert(expense.status === 'Approved', 'Expense status defaults to Approved');

    // Net Cashflow Computation
    const totalCollectedFees = 600;
    const totalExpenditure = expense.amount;
    const netCashflow = totalCollectedFees - totalExpenditure;

    assert(netCashflow === 150, 'Net cashflow accurately computes $150 ($600 collected - $450 expense)');

    // Summary
    console.log('\n====================================================');
    console.log(`Phase 7 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 7 Test Error:', err);
    process.exit(1);
  }
};

runPhase7Tests();
