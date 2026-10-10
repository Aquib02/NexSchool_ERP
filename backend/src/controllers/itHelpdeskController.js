import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import ITTicket from '../models/ITTicket.js';

const generateAssetTag = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AST-${year}-${rand}`;
};

const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${year}-${rand}`;
};

// ==========================================
// 1. ASSET MANAGEMENT
// ==========================================

export const getAssets = async (req, res, next) => {
  try {
    const { category, status, location, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ name: searchRegex }, { assetTag: searchRegex }, { serialNumber: searchRegex }];
    }

    const assets = await Asset.find(query)
      .populate('assignedTo', 'employeeId firstName lastName departmentId')
      .sort({ createdAt: -1 });

    const stats = {
      total: assets.length,
      inUse: assets.filter((a) => a.status === 'In Use').length,
      inStock: assets.filter((a) => a.status === 'In Stock').length,
      underRepair: assets.filter((a) => a.status === 'Under Repair').length,
      damagedOrRetired: assets.filter((a) => ['Damaged', 'Retired'].includes(a.status)).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req, res, next) => {
  try {
    const {
      name,
      category,
      serialNumber,
      specifications,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      assignedTo,
      location,
      status = 'In Stock',
    } = req.body;

    if (!name || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'name, category, and location are required fields',
      });
    }

    const asset = await Asset.create({
      assetTag: generateAssetTag(),
      name: name.trim(),
      category,
      serialNumber: serialNumber?.trim() || undefined,
      specifications: specifications?.trim(),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      location: location.trim(),
      status,
    });

    const populatedAsset = await Asset.findById(asset._id).populate(
      'assignedTo',
      'employeeId firstName lastName'
    );

    return res.status(201).json({
      success: true,
      message: 'Asset registered successfully',
      data: populatedAsset,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, serialNumber, specifications, purchasePrice, warrantyExpiry, assignedTo, location, status } =
      req.body;

    const updatePayload = {
      ...(name && { name: name.trim() }),
      ...(category && { category }),
      ...(serialNumber !== undefined && { serialNumber: serialNumber?.trim() || null }),
      ...(specifications !== undefined && { specifications: specifications?.trim() }),
      ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
      ...(warrantyExpiry && { warrantyExpiry: new Date(warrantyExpiry) }),
      ...(location && { location: location.trim() }),
      ...(status && { status }),
      ...(assignedTo !== undefined && {
        assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      }),
    };

    const asset = await Asset.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true }).populate(
      'assignedTo',
      'employeeId firstName lastName'
    );

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. HELPDESK TICKETS
// ==========================================

export const getTickets = async (req, res, next) => {
  try {
    const { category, priority, status, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ title: searchRegex }, { ticketNumber: searchRegex }];
    }

    const tickets = await ITTicket.find(query)
      .populate('raisedBy', 'username firstName lastName email')
      .populate('assignedTo', 'username firstName lastName email')
      .populate('assetId', 'assetTag name category location')
      .populate('comments.senderId', 'username firstName lastName')
      .sort({ createdAt: -1 });

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'Open').length,
      inProgress: tickets.filter((t) => ['Assigned', 'In Progress'].includes(t.status)).length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length,
      closed: tickets.filter((t) => t.status === 'Closed').length,
      urgent: tickets.filter((t) => t.priority === 'Urgent' && !['Resolved', 'Closed'].includes(t.status)).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority = 'Medium', assetId, assignedTo } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and category are required',
      });
    }

    const ticket = await ITTicket.create({
      ticketNumber: generateTicketNumber(),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'Open',
      raisedBy: req.user?._id || new mongoose.Types.ObjectId(),
      assignedTo: assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
      assetId: assetId && mongoose.Types.ObjectId.isValid(assetId) ? assetId : null,
      comments: [],
    });

    const populatedTicket = await ITTicket.findById(ticket._id)
      .populate('raisedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName')
      .populate('assetId', 'assetTag name location');

    return res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: populatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes } = req.body;

    const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status' });
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (assignedTo !== undefined) {
      updatePayload.assignedTo = assignedTo && mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null;
    }
    if (resolutionNotes) updatePayload.resolutionNotes = resolutionNotes.trim();

    if (status === 'Resolved') {
      updatePayload.resolvedAt = new Date();
    } else if (status === 'Closed') {
      updatePayload.closedAt = new Date();
    }

    const ticket = await ITTicket.findByIdAndUpdate(id, updatePayload, { new: true })
      .populate('raisedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName')
      .populate('assetId', 'assetTag name location')
      .populate('comments.senderId', 'username firstName lastName');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const addTicketComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Comment message is required' });
    }

    const comment = {
      senderId: req.user?._id || new mongoose.Types.ObjectId(),
      message: message.trim(),
      createdAt: new Date(),
    };

    const ticket = await ITTicket.findByIdAndUpdate(
      id,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate('raisedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName')
      .populate('comments.senderId', 'username firstName lastName');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment added to ticket',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
