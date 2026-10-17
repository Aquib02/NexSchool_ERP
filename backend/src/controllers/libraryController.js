import mongoose from 'mongoose';
import Book from '../models/Book.js';
import LibraryTransaction from '../models/LibraryTransaction.js';
import Student from '../models/Student.js';
import Employee from '../models/Employee.js';

// Helper for unique library transaction serial
const generateTransactionNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TRX-${year}-${rand}`;
};

// ==========================================
// 1. BOOK CATALOG MANAGEMENT
// ==========================================

export const createBook = async (req, res, next) => {
  try {
    if (req.user?.role?.name === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Students are not authorized to catalog books.',
      });
    }
    const {
      title,
      author,
      category,
      isbn,
      publisher,
      edition,
      rackLocation,
      totalCopies = 1,
      price = 0,
    } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({
        success: false,
        message: 'title, author, and category are required to add a book',
      });
    }

    const copies = Math.max(1, Number(totalCopies) || 1);

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      isbn: isbn?.trim().toUpperCase() || null,
      publisher: publisher?.trim() || null,
      edition: edition?.trim() || null,
      rackLocation: rackLocation || { rackNumber: 'R-01', shelfNumber: 'S-1' },
      totalCopies: copies,
      availableCopies: copies,
      issuedCopies: 0,
      price: Number(price) || 0,
    });

    res.status(201).json({
      success: true,
      data: book,
      message: 'Book cataloged successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBooks = async (req, res, next) => {
  try {
    const { category, search, availableOnly, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (availableOnly === 'true') filter.availableCopies = { $gt: 0 };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Book.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: books.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    if (req.user?.role?.name === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Students are not authorized to update books.',
      });
    }
    const { id } = req.params;
    const { title, author, category, isbn, totalCopies, rackLocation, price } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (category) book.category = category.trim();
    if (isbn) book.isbn = isbn.trim().toUpperCase();
    if (rackLocation) book.rackLocation = rackLocation;
    if (price !== undefined) book.price = Number(price);

    if (totalCopies !== undefined) {
      const newTotal = Math.max(book.issuedCopies, Number(totalCopies));
      const difference = newTotal - book.totalCopies;
      book.totalCopies = newTotal;
      book.availableCopies = Math.max(0, book.availableCopies + difference);
    }

    await book.save();

    res.status(200).json({
      success: true,
      data: book,
      message: 'Book record updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    if (req.user?.role?.name === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Students are not authorized to delete books.',
      });
    }
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.issuedCopies > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book while ${book.issuedCopies} copies are currently on loan.`,
      });
    }

    book.isActive = false;
    await book.save();

    res.status(200).json({ success: true, message: 'Book archived from catalog successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. ISSUE & RETURN CIRCULATION WORKFLOW
// ==========================================

export const issueBook = async (req, res, next) => {
  try {
    if (req.user?.role?.name === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Students are not authorized to issue library books.',
      });
    }
    const { bookId, patronType = 'Student', studentId, employeeId, dueDate, remarks } = req.body;

    if (!bookId || (!studentId && !employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'bookId and either studentId or employeeId are required',
      });
    }

    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found or inactive' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available copies left in library for checkout',
      });
    }

    // 1. Decrement available copies & increment issued copies
    book.availableCopies -= 1;
    book.issuedCopies += 1;
    await book.save();

    // 2. Set default 14-day loan period if not specified
    const returnDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const transactionNumber = generateTransactionNumber();

    const transaction = await LibraryTransaction.create({
      transactionNumber,
      bookId: book._id,
      patronType,
      studentId: patronType === 'Student' ? studentId : null,
      employeeId: patronType === 'Staff' ? employeeId : null,
      issueDate: new Date(),
      dueDate: returnDueDate,
      status: 'Issued',
      issuedBy: req.user?._id || new mongoose.Types.ObjectId(),
      remarks: remarks?.trim() || null,
    });

    const populated = await LibraryTransaction.findById(transaction._id)
      .populate('bookId', 'title author isbn rackLocation')
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('employeeId', 'firstName lastName employeeId')
      .populate('issuedBy', 'username');

    res.status(201).json({
      success: true,
      data: populated,
      message: `Book "${book.title}" issued successfully (Due: ${returnDueDate.toLocaleDateString()})`,
    });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req, res, next) => {
  try {
    if (req.user?.role?.name === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Students are not authorized to process book returns.',
      });
    }
    const { id } = req.params;
    const { finePaid = false, remarks } = req.body;

    const transaction = await LibraryTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Book is already marked as returned' });
    }

    // 1. Compute dynamic overdue fine ($1 per day past due date)
    const now = new Date();
    let fineAmount = 0;
    if (now > new Date(transaction.dueDate)) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(transaction.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      fineAmount = Math.max(0, daysOverdue * 1); // $1/day
    }

    // 2. Update transaction
    transaction.returnDate = now;
    transaction.status = 'Returned';
    transaction.fineAmount = fineAmount;
    transaction.finePaid = finePaid;
    transaction.receivedBy = req.user?._id || null;
    if (remarks) transaction.remarks = remarks.trim();
    await transaction.save();

    // 3. Restore book inventory counts
    const book = await Book.findById(transaction.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      book.issuedCopies = Math.max(0, book.issuedCopies - 1);
      await book.save();
    }

    const populated = await LibraryTransaction.findById(transaction._id)
      .populate('bookId', 'title author')
      .populate('studentId', 'firstName lastName admissionNumber')
      .populate('employeeId', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      data: populated,
      message: `Book returned successfully.${fineAmount > 0 ? ` Overdue fine: $${fineAmount}` : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { status, studentId, employeeId, bookId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user?.role?.name === 'STUDENT') {
      let resolvedStudentId = req.user.studentId;
      if (!resolvedStudentId && req.user._id) {
        const sDoc = await Student.findOne({ userId: req.user._id });
        if (sDoc) resolvedStudentId = sDoc._id;
      }
      filter.studentId = resolvedStudentId;
    } else {
      if (studentId) filter.studentId = studentId;
    }
    if (employeeId) filter.employeeId = employeeId;
    if (bookId) filter.bookId = bookId;

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      LibraryTransaction.find(filter)
        .populate('bookId', 'title author isbn rackLocation')
        .populate('studentId', 'firstName lastName admissionNumber')
        .populate('employeeId', 'firstName lastName employeeId')
        .populate('issuedBy', 'username')
        .populate('receivedBy', 'username')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LibraryTransaction.countDocuments(filter),
    ]);

    // Check overdue dynamically
    const now = new Date();
    for (const trx of transactions) {
      if (trx.status === 'Issued' && new Date(trx.dueDate) < now) {
        trx.status = 'Overdue';
        const days = Math.ceil((now.getTime() - new Date(trx.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        trx.fineAmount = days * 1;
      }
    }

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};
