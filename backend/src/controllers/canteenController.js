import mongoose from 'mongoose';
import CanteenItem from '../models/CanteenItem.js';
import CanteenTransaction from '../models/CanteenTransaction.js';

const generateItemCode = () => {
  const rand = Math.floor(100 + Math.random() * 900);
  return `FD-${rand}`;
};

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${rand}`;
};

// ==========================================
// 1. CANTEEN MENU ITEMS
// ==========================================

export const getCanteenItems = async (req, res, next) => {
  try {
    const { category, isVegetarian, isAvailable, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true';
    }
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ name: searchRegex }, { itemCode: searchRegex }];
    }

    const items = await CanteenItem.find(query).sort({ category: 1, name: 1 });

    const stats = {
      total: items.length,
      available: items.filter((i) => i.isAvailable).length,
      veg: items.filter((i) => i.isVegetarian).length,
      nonVeg: items.filter((i) => !i.isVegetarian).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createCanteenItem = async (req, res, next) => {
  try {
    const {
      itemCode,
      name,
      category,
      price,
      costPrice = 0,
      quantityInStock = 0,
      isVegetarian = true,
      allergens = [],
      isAvailable = true,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, category, and price are required fields',
      });
    }

    const code = itemCode?.trim()?.toUpperCase() || generateItemCode();

    const existing = await CanteenItem.findOne({ itemCode: code });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Item code already exists' });
    }

    const item = await CanteenItem.create({
      itemCode: code,
      name: name.trim(),
      category,
      price: Number(price),
      costPrice: Number(costPrice),
      quantityInStock: Number(quantityInStock),
      isVegetarian: Boolean(isVegetarian),
      allergens: Array.isArray(allergens) ? allergens : [],
      isAvailable: Boolean(isAvailable),
    });

    return res.status(201).json({
      success: true,
      message: 'Canteen item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCanteenItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, price, costPrice, quantityInStock, isVegetarian, allergens, isAvailable } = req.body;

    const updatePayload = {
      ...(name && { name: name.trim() }),
      ...(category && { category }),
      ...(price !== undefined && { price: Number(price) }),
      ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
      ...(quantityInStock !== undefined && { quantityInStock: Number(quantityInStock) }),
      ...(isVegetarian !== undefined && { isVegetarian: Boolean(isVegetarian) }),
      ...(allergens !== undefined && { allergens: Array.isArray(allergens) ? allergens : [] }),
      ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
    };

    const item = await CanteenItem.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Canteen item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Canteen item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. POS SALES TRANSACTIONS
// ==========================================

export const getTransactions = async (req, res, next) => {
  try {
    const { customerType, paymentMethod, paymentStatus, date } = req.query;
    let query = {};

    if (customerType && customerType !== 'All') {
      query.customerType = customerType;
    }
    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }
    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const transactions = await CanteenTransaction.find(query)
      .populate('studentId', 'admissionNumber firstName lastName')
      .populate('employeeId', 'employeeId firstName lastName')
      .populate('servedBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    const totalRevenue = transactions
      .filter((t) => t.paymentStatus === 'Paid')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const stats = {
      totalOrders: transactions.length,
      paidOrders: transactions.filter((t) => t.paymentStatus === 'Paid').length,
      totalRevenue,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const {
      customerType = 'Student',
      studentId,
      employeeId,
      items,
      paymentMethod = 'Cash',
      paymentStatus = 'Paid',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item must be included in the order',
      });
    }

    // Compute total and validate items
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const lineItem of items) {
      if (!lineItem.itemId || !lineItem.quantity || lineItem.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must include a valid itemId and positive quantity',
        });
      }

      const menuItem = await CanteenItem.findById(lineItem.itemId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${lineItem.itemId}`,
        });
      }

      const unitPrice = menuItem.price;
      const subtotal = unitPrice * lineItem.quantity;
      calculatedTotal += subtotal;

      validatedItems.push({
        itemId: menuItem._id,
        name: menuItem.name,
        quantity: lineItem.quantity,
        unitPrice,
        subtotal,
      });

      // Optionally decrement stock if stock tracking enabled
      if (menuItem.quantityInStock > 0) {
        menuItem.quantityInStock = Math.max(0, menuItem.quantityInStock - lineItem.quantity);
        await menuItem.save();
      }
    }

    const orderNumber = generateOrderNumber();

    const transaction = await CanteenTransaction.create({
      orderNumber,
      customerType,
      studentId: customerType === 'Student' && studentId && mongoose.Types.ObjectId.isValid(studentId) ? studentId : null,
      employeeId: customerType === 'Staff' && employeeId && mongoose.Types.ObjectId.isValid(employeeId) ? employeeId : null,
      items: validatedItems,
      totalAmount: calculatedTotal,
      paymentMethod,
      paymentStatus,
      servedBy: req.user?._id || new mongoose.Types.ObjectId(),
    });

    const populatedTransaction = await CanteenTransaction.findById(transaction._id)
      .populate('studentId', 'admissionNumber firstName lastName')
      .populate('employeeId', 'employeeId firstName lastName')
      .populate('servedBy', 'username firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Canteen order processed successfully',
      data: populatedTransaction,
    });
  } catch (error) {
    next(error);
  }
};
