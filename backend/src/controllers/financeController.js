import mongoose from 'mongoose';
import FeeStructure from '../models/FeeStructure.js';
import StudentFee from '../models/StudentFee.js';
import Payment from '../models/Payment.js';
import Receipt from '../models/Receipt.js';
import Expense from '../models/Expense.js';
import Student from '../models/Student.js';
import SchoolClass from '../models/SchoolClass.js';
import AcademicSession from '../models/AcademicSession.js';

// Helper to generate unique human-readable transactional serials
const generateCode = (prefix) => {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  const timeSuffix = Date.now().toString().slice(-3);
  return `${prefix}-${year}-${randomPart}${timeSuffix}`;
};

// Helper to resolve or create a default active academic session if none exists
const resolveAcademicSession = async (sessionId) => {
  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    const found = await AcademicSession.findById(sessionId);
    if (found) return found._id;
  }

  let activeSession = await AcademicSession.findOne({ isCurrent: true });
  if (!activeSession) {
    activeSession = await AcademicSession.findOne().sort({ createdAt: -1 });
  }

  if (!activeSession) {
    const currentYear = new Date().getFullYear();
    activeSession = await AcademicSession.create({
      name: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(currentYear, 3, 1), // April 1st
      endDate: new Date(currentYear + 1, 2, 31), // March 31st
      isCurrent: true,
      status: 'active',
    });
  }

  return activeSession._id;
};

// ==========================================
// 1. FEE STRUCTURE CONTROLLERS
// ==========================================

export const createFeeStructure = async (req, res, next) => {
  try {
    const {
      name,
      classId,
      academicSessionId,
      components = [],
      dueDate,
      lateFinePerDay = 0,
    } = req.body;

    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Name and classId are required to create a fee structure',
      });
    }

    const session = await resolveAcademicSession(academicSessionId);

    // Compute totalAmount from components
    const totalAmount = components.reduce(
      (sum, comp) => sum + (Number(comp.amount) || 0),
      0
    );

    const calculatedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const feeStructure = await FeeStructure.create({
      name: name.trim(),
      classId,
      academicSessionId: session,
      components,
      totalAmount,
      dueDate: calculatedDueDate,
      lateFinePerDay: Number(lateFinePerDay) || 0,
    });

    const populated = await FeeStructure.findById(feeStructure._id)
      .populate('classId', 'name code')
      .populate('academicSessionId', 'name isCurrent');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Fee structure created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFeeStructures = async (req, res, next) => {
  try {
    const { classId, academicSessionId, isActive } = req.query;
    const filter = {};

    if (classId) filter.classId = classId;
    if (academicSessionId) filter.academicSessionId = academicSessionId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const structures = await FeeStructure.find(filter)
      .populate('classId', 'name code')
      .populate('academicSessionId', 'name isCurrent')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: structures.length,
      data: structures,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, components, dueDate, lateFinePerDay, isActive } = req.body;

    const structure = await FeeStructure.findById(id);
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    if (name) structure.name = name.trim();
    if (dueDate) structure.dueDate = new Date(dueDate);
    if (lateFinePerDay !== undefined) structure.lateFinePerDay = Number(lateFinePerDay);
    if (isActive !== undefined) structure.isActive = isActive;

    if (Array.isArray(components)) {
      structure.components = components;
      structure.totalAmount = components.reduce(
        (sum, comp) => sum + (Number(comp.amount) || 0),
        0
      );
    }

    await structure.save();

    const populated = await FeeStructure.findById(structure._id)
      .populate('classId', 'name code')
      .populate('academicSessionId', 'name isCurrent');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Fee structure updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. STUDENT INVOICING / ALLOCATION
// ==========================================

export const generateInvoices = async (req, res, next) => {
  try {
    const {
      feeStructureId,
      classId,
      sectionId,
      studentId,
      dueDateOverride,
    } = req.body;

    if (!feeStructureId) {
      return res.status(400).json({ success: false, message: 'feeStructureId is required' });
    }

    const structure = await FeeStructure.findById(feeStructureId);
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }

    // Determine target students
    let students = [];
    if (studentId) {
      const singleStudent = await Student.findById(studentId);
      if (!singleStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      students = [singleStudent];
    } else {
      const queryClassId = classId || structure.classId;
      const studentFilter = {
        $or: [{ classId: queryClassId }, { currentClass: queryClassId }],
        status: { $regex: /^active$/i },
      };
      if (sectionId) {
        studentFilter.$and = [
          { $or: [{ sectionId }, { currentSection: sectionId }] },
        ];
      }
      students = await Student.find(studentFilter);
    }

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible active students found for fee generation in this class',
      });
    }

    const invoiceDueDate = dueDateOverride ? new Date(dueDateOverride) : structure.dueDate;
    const createdInvoices = [];
    let skippedCount = 0;

    for (const student of students) {
      // Check for existing invoice for this student and structure
      const existing = await StudentFee.findOne({
        studentId: student._id,
        feeStructureId: structure._id,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const invoiceNumber = generateCode('INV');
      const baseAmount = structure.totalAmount;
      const netPayable = baseAmount;
      const balanceAmount = netPayable;

      const invoice = await StudentFee.create({
        invoiceNumber,
        studentId: student._id,
        feeStructureId: structure._id,
        academicSessionId: structure.academicSessionId || (await resolveAcademicSession()),
        baseAmount,
        discountAmount: 0,
        lateFine: 0,
        netPayable,
        paidAmount: 0,
        balanceAmount,
        dueDate: invoiceDueDate,
        status: invoiceDueDate < new Date() ? 'Overdue' : 'Unpaid',
      });

      createdInvoices.push(invoice);
    }

    if (createdInvoices.length === 0 && skippedCount > 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        skippedCount,
        data: [],
        message: `All ${skippedCount} eligible active student(s) already have an invoice generated for this fee structure.`,
      });
    }

    res.status(201).json({
      success: true,
      count: createdInvoices.length,
      skippedCount,
      data: createdInvoices,
      message: `Generated ${createdInvoices.length} invoice(s) successfully (${skippedCount} already existed).`,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentFees = async (req, res, next) => {
  try {
    const {
      studentId,
      classId,
      sectionId,
      status,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    // Filter by student attributes (name, admission number, class, section) or invoice number
    if (classId || sectionId || search) {
      const studentQuery = {};
      const conditions = [];

      if (classId) {
        conditions.push({ $or: [{ classId }, { currentClass: classId }] });
      }
      if (sectionId) {
        conditions.push({ $or: [{ sectionId }, { currentSection: sectionId }] });
      }

      let studentIds = [];
      let isStudentQueryActive = false;

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        conditions.push({
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { admissionNumber: searchRegex },
            { studentId: searchRegex },
          ],
        });
      }

      if (conditions.length > 0) {
        studentQuery.$and = conditions;
        isStudentQueryActive = true;
        const matchingStudents = await Student.find(studentQuery).select('_id');
        studentIds = matchingStudents.map((s) => s._id);
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        if (classId || sectionId) {
          filter.studentId = { $in: studentIds };
        } else {
          filter.$or = [
            { invoiceNumber: searchRegex },
            { studentId: { $in: studentIds } },
          ];
        }
      } else if (isStudentQueryActive) {
        filter.studentId = { $in: studentIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
      StudentFee.find(filter)
        .populate({
          path: 'studentId',
          select: 'firstName lastName admissionNumber classId sectionId parentId emergencyContact contact',
          populate: [
            { path: 'classId', select: 'name code' },
            { path: 'sectionId', select: 'name' },
            { path: 'parentId', select: 'fatherName fatherPhone' },
          ],
        })
        .populate('feeStructureId', 'name components totalAmount lateFinePerDay dueDate')
        .populate('academicSessionId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StudentFee.countDocuments(filter),
    ]);

    // Check dynamically if unpaid invoices are overdue
    const now = new Date();
    for (const inv of invoices) {
      if ((inv.status === 'Unpaid' || inv.status === 'Partially Paid') && new Date(inv.dueDate) < now) {
        inv.status = 'Overdue';
      }
    }

    res.status(200).json({
      success: true,
      count: invoices.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentFeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await StudentFee.findById(id)
      .populate({
        path: 'studentId',
        select: 'firstName lastName admissionNumber email phone emergencyContact classId sectionId parentId contact',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
          { path: 'parentId', select: 'fatherName motherName guardianName fatherPhone fatherEmail' },
        ],
      })
      .populate('feeStructureId')
      .populate('academicSessionId', 'name');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const payments = await Payment.find({ studentFeeId: invoice._id })
      .populate('collectedBy', 'username email')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...invoice.toObject(),
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const applyDiscountOrWaiver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discountAmount, discountReason, isWaiver = false } = req.body;

    const invoice = await StudentFee.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply discounts to an invoice that is already fully paid',
      });
    }

    if (isWaiver) {
      invoice.discountAmount = invoice.baseAmount;
      invoice.discountReason = discountReason || 'Full Fee Waiver';
      invoice.netPayable = 0;
      invoice.balanceAmount = 0;
      invoice.status = 'Waived';
    } else {
      const discount = Number(discountAmount) || 0;
      if (discount < 0) {
        return res.status(400).json({ success: false, message: 'Discount amount cannot be negative' });
      }
      if (discount > invoice.baseAmount) {
        return res.status(400).json({
          success: false,
          message: `Discount ($${discount}) cannot exceed base fee amount ($${invoice.baseAmount})`,
        });
      }

      invoice.discountAmount = discount;
      invoice.discountReason = discountReason?.trim() || 'Scholarship / Sibling Discount';
      invoice.netPayable = Math.max(0, invoice.baseAmount - discount + (invoice.lateFine || 0));
      invoice.balanceAmount = Math.max(0, invoice.netPayable - invoice.paidAmount);

      if (invoice.balanceAmount === 0) {
        invoice.status = 'Paid';
      } else if (invoice.paidAmount > 0) {
        invoice.status = 'Partially Paid';
      } else {
        invoice.status = new Date(invoice.dueDate) < new Date() ? 'Overdue' : 'Unpaid';
      }
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      data: invoice,
      message: isWaiver ? 'Fee waiver applied successfully' : 'Discount applied successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PAYMENT COLLECTION & RECEIPTS
// ==========================================

export const collectPayment = async (req, res, next) => {
  try {
    const {
      studentFeeId,
      amount,
      paymentMethod,
      transactionReference,
      remarks,
      paymentDate,
    } = req.body;

    if (!studentFeeId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'studentFeeId, amount, and paymentMethod are required',
      });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero',
      });
    }

    const invoice = await StudentFee.findById(studentFeeId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Student fee invoice not found' });
    }

    if (invoice.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already fully settled',
      });
    }

    if (payAmount > invoice.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${payAmount}) exceeds outstanding balance ($${invoice.balanceAmount})`,
      });
    }

    // 1. Create Payment Record
    const paymentNumber = generateCode('PAY');
    const payment = await Payment.create({
      paymentNumber,
      studentFeeId: invoice._id,
      studentId: invoice.studentId,
      amount: payAmount,
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      transactionReference: transactionReference?.trim() || null,
      status: 'Success',
      collectedBy: req.user?._id || new mongoose.Types.ObjectId(),
      remarks: remarks?.trim() || null,
    });

    // 2. Update Invoice Balances & Status
    invoice.paidAmount += payAmount;
    invoice.balanceAmount = Math.max(0, invoice.netPayable - invoice.paidAmount);

    if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }
    await invoice.save();

    // 3. Fetch Full Student Data for Immutable Receipt Snapshot
    const student = await Student.findById(invoice.studentId)
      .populate('classId', 'name')
      .populate('currentClass', 'name')
      .populate('sectionId', 'name')
      .populate('currentSection', 'name')
      .populate('parentId', 'fatherName motherName guardianName fatherPhone');

    const primaryParent =
      student?.parentId?.fatherName ||
      student?.parentId?.guardianName ||
      student?.emergencyContact?.name ||
      student?.parents?.[0]?.parentId?.fullName ||
      'Guardian / Self';
    const className = student?.classId?.name || student?.currentClass?.name || 'Class N/A';
    const sectionName = student?.sectionId?.name || student?.currentSection?.name || 'Section N/A';

    // 4. Create Immutable Receipt Record
    const receiptNumber = generateCode('REC');
    const receipt = await Receipt.create({
      receiptNumber,
      paymentId: payment._id,
      studentFeeId: invoice._id,
      studentId: invoice.studentId,
      amountPaid: payAmount,
      paymentMethod,
      receiptDate: payment.paymentDate,
      snapshot: {
        schoolName: 'Global International School',
        studentName: `${student?.firstName || 'Unknown'} ${student?.lastName || ''}`.trim(),
        studentId: student?.admissionNumber || student?.studentId || student?._id?.toString() || 'N/A',
        admissionNumber: student?.admissionNumber || 'N/A',
        className,
        sectionName,
        parentName: primaryParent,
        invoiceNumber: invoice.invoiceNumber,
        balanceRemaining: invoice.balanceAmount,
      },
      issuedBy: req.user?._id || new mongoose.Types.ObjectId(),
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded and receipt generated successfully',
      data: {
        payment,
        receipt,
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const { studentId, paymentMethod, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('studentFeeId', 'invoiceNumber baseAmount netPayable balanceAmount')
        .populate('collectedBy', 'username')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const getReceiptById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let receipt = await Receipt.findById(id)
      .populate('paymentId')
      .populate('studentFeeId')
      .populate('issuedBy', 'username email');

    if (!receipt) {
      // Allow searching by paymentId as well
      receipt = await Receipt.findOne({ paymentId: id })
        .populate('paymentId')
        .populate('studentFeeId')
        .populate('issuedBy', 'username email');
    }

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
};

export const getReceipts = async (req, res, next) => {
  try {
    const { studentId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { 'snapshot.studentName': { $regex: search, $options: 'i' } },
        { 'snapshot.admissionNumber': { $regex: search, $options: 'i' } },
        { 'snapshot.invoiceNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate('issuedBy', 'username')
        .sort({ receiptDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Receipt.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: receipts.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: receipts,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DEFAULTERS & FINANCIAL OVERVIEW
// ==========================================

export const getDefaulters = async (req, res, next) => {
  try {
    const now = new Date();

    const defaulters = await StudentFee.find({
      balanceAmount: { $gt: 0 },
      dueDate: { $lt: now },
      status: { $ne: 'Waived' },
    })
      .populate({
        path: 'studentId',
        select: 'firstName lastName admissionNumber classId sectionId parentId phone contact emergencyContact',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
          { path: 'parentId', select: 'fatherName fatherPhone fatherEmail' },
        ],
      })
      .populate('feeStructureId', 'name lateFinePerDay')
      .sort({ dueDate: 1 });

    const formatted = defaulters.map((d) => {
      const daysOverdue = Math.max(
        1,
        Math.floor((now.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      const fineRate = d.feeStructureId?.lateFinePerDay || 0;
      const accruedLateFine = daysOverdue * fineRate;

      return {
        _id: d._id,
        invoiceNumber: d.invoiceNumber,
        student: d.studentId,
        feeStructureName: d.feeStructureId?.name || 'General Fee',
        dueDate: d.dueDate,
        daysOverdue,
        baseAmount: d.baseAmount,
        netPayable: d.netPayable,
        paidAmount: d.paidAmount,
        balanceAmount: d.balanceAmount,
        accruedLateFine,
        totalWithFine: d.balanceAmount + accruedLateFine,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getFinancialOverview = async (req, res, next) => {
  try {
    // 1. Invoiced Metrics
    const invoiceMetrics = await StudentFee.aggregate([
      {
        $group: {
          _id: null,
          totalBase: { $sum: '$baseAmount' },
          totalDiscounts: { $sum: '$discountAmount' },
          totalNetPayable: { $sum: '$netPayable' },
          totalCollected: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$balanceAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Status Breakdown
    const statusBreakdown = await StudentFee.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$netPayable' },
          balance: { $sum: '$balanceAmount' },
        },
      },
    ]);

    // 3. Payment Methods Breakdown
    const paymentMethods = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    // 4. Expenses Total
    const expenseMetrics = await Expense.aggregate([
      { $match: { status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 5. Category-wise Expenses
    const expenseCategories = await Expense.aggregate([
      { $match: { status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const metrics = invoiceMetrics[0] || {
      totalBase: 0,
      totalDiscounts: 0,
      totalNetPayable: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      count: 0,
    };

    const totalExpenses = expenseMetrics[0]?.totalExpenses || 0;
    const netCashflow = (metrics.totalCollected || 0) - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInvoiced: metrics.totalNetPayable,
          totalCollected: metrics.totalCollected,
          totalOutstanding: metrics.totalOutstanding,
          totalDiscounts: metrics.totalDiscounts,
          totalExpenses,
          netCashflow,
          totalInvoicesCount: metrics.count,
        },
        statusBreakdown,
        paymentMethods,
        expenseCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. EXPENSE MANAGEMENT
// ==========================================

export const createExpense = async (req, res, next) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      paymentMethod = 'Bank Transfer',
      vendorName,
      vendorInvoiceNumber,
      receiptAttachment,
      remarks,
    } = req.body;

    if (!title || !category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'title, category, and amount are required to log an expense',
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be greater than zero',
      });
    }

    const expense = await Expense.create({
      title: title.trim(),
      category,
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      vendorName: vendorName?.trim() || null,
      vendorInvoiceNumber: vendorInvoiceNumber?.trim() || null,
      receiptAttachment: receiptAttachment || null,
      remarks: remarks?.trim() || null,
      approvedBy: req.user?._id || null,
      status: 'Approved',
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense logged successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const { category, status, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
        { vendorInvoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('approvedBy', 'username email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Expense.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: expenses.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpenseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    if (status) expense.status = status;
    if (remarks) expense.remarks = remarks.trim();
    expense.approvedBy = req.user?._id || expense.approvedBy;

    await expense.save();

    res.status(200).json({
      success: true,
      data: expense,
      message: `Expense status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
