import mongoose from 'mongoose';
import HousekeepingArea from '../models/HousekeepingArea.js';
import HousekeepingTask from '../models/HousekeepingTask.js';
import CleaningSupply from '../models/CleaningSupply.js';

const generateTaskCode = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TSK-${year}-${rand}`;
};

// ==========================================
// 1. CAMPUS HOUSEKEEPING AREAS
// ==========================================

export const getHousekeepingAreas = async (req, res, next) => {
  try {
    const { building, isActive } = req.query;
    let query = {};

    if (building && building !== 'All') {
      query.building = building;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const areas = await HousekeepingArea.find(query)
      .populate('supervisorId', 'employeeId firstName lastName')
      .sort({ building: 1, floor: 1, name: 1 });

    return res.status(200).json({
      success: true,
      count: areas.length,
      data: areas,
    });
  } catch (error) {
    next(error);
  }
};

export const createHousekeepingArea = async (req, res, next) => {
  try {
    const { name, building, floor, cleaningFrequency = 'Daily', supervisorId, isActive = true } = req.body;

    if (!name || !building || !floor) {
      return res.status(400).json({
        success: false,
        message: 'name, building, and floor are required',
      });
    }

    const existing = await HousekeepingArea.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Housekeeping area with this name already exists',
      });
    }

    const area = await HousekeepingArea.create({
      name: name.trim(),
      building: building.trim(),
      floor: floor.trim(),
      cleaningFrequency,
      supervisorId: supervisorId && mongoose.Types.ObjectId.isValid(supervisorId) ? supervisorId : null,
      isActive,
    });

    const populatedArea = await HousekeepingArea.findById(area._id).populate(
      'supervisorId',
      'employeeId firstName lastName'
    );

    return res.status(201).json({
      success: true,
      message: 'Housekeeping area created successfully',
      data: populatedArea,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHousekeepingArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, building, floor, cleaningFrequency, supervisorId, isActive } = req.body;

    const updatePayload = {
      ...(name && { name: name.trim() }),
      ...(building && { building: building.trim() }),
      ...(floor && { floor: floor.trim() }),
      ...(cleaningFrequency && { cleaningFrequency }),
      ...(isActive !== undefined && { isActive }),
      ...(supervisorId !== undefined && {
        supervisorId: supervisorId && mongoose.Types.ObjectId.isValid(supervisorId) ? supervisorId : null,
      }),
    };

    const area = await HousekeepingArea.findByIdAndUpdate(id, updatePayload, { new: true }).populate(
      'supervisorId',
      'employeeId firstName lastName'
    );

    if (!area) {
      return res.status(404).json({ success: false, message: 'Housekeeping area not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Housekeeping area updated successfully',
      data: area,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CLEANING ROSTERS & TASKS
// ==========================================

export const getHousekeepingTasks = async (req, res, next) => {
  try {
    const { areaId, assignedTo, status, shift, date } = req.query;
    let query = {};

    if (areaId && mongoose.Types.ObjectId.isValid(areaId)) {
      query.areaId = areaId;
    }
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      query.assignedTo = assignedTo;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (shift && shift !== 'All') {
      query.shift = shift;
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const tasks = await HousekeepingTask.find(query)
      .populate('areaId', 'name building floor')
      .populate('assignedTo', 'employeeId firstName lastName phone')
      .populate('verifiedBy', 'username firstName lastName')
      .sort({ scheduledDate: -1, createdAt: -1 });

    const stats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'Completed' || t.status === 'Verified').length,
      pending: tasks.filter((t) => t.status === 'Pending').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      verified: tasks.filter((t) => t.status === 'Verified').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createHousekeepingTask = async (req, res, next) => {
  try {
    const { title, areaId, assignedTo, scheduledDate, shift = 'Morning', checklist = [], remarks } = req.body;

    if (!title || !areaId || !assignedTo || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'title, areaId, assignedTo, and scheduledDate are required',
      });
    }

    // Default checklist if empty
    const normalizedChecklist =
      checklist.length > 0
        ? checklist.map((item) => (typeof item === 'string' ? { item, isCompleted: false } : item))
        : [
            { item: 'Sweep & Mop floors with disinfectant', isCompleted: false },
            { item: 'Empty waste bins and replace liners', isCompleted: false },
            { item: 'Clean & sanitize high-touch surfaces/handles', isCompleted: false },
            { item: 'Refill soap dispensers & sanitizers', isCompleted: false },
          ];

    const task = await HousekeepingTask.create({
      taskCode: generateTaskCode(),
      title: title.trim(),
      areaId,
      assignedTo,
      scheduledDate: new Date(scheduledDate),
      shift,
      checklist: normalizedChecklist,
      status: 'Pending',
      remarks: remarks?.trim(),
    });

    const populatedTask = await HousekeepingTask.findById(task._id)
      .populate('areaId', 'name building floor')
      .populate('assignedTo', 'employeeId firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Housekeeping task assigned successfully',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHousekeepingTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checklist, status, remarks } = req.body;

    const task = await HousekeepingTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (checklist) {
      task.checklist = checklist;
    }
    if (remarks !== undefined) {
      task.remarks = remarks.trim();
    }
    if (status) {
      task.status = status;
      if (status === 'Completed' && !task.completedAt) {
        task.completedAt = new Date();
      }
      if (status === 'Verified') {
        task.verifiedBy = req.user?._id || new mongoose.Types.ObjectId();
      }
    }

    // Auto-advance status if all checklist items are completed
    if (
      task.checklist.length > 0 &&
      task.checklist.every((c) => c.isCompleted) &&
      task.status === 'Pending'
    ) {
      task.status = 'Completed';
      task.completedAt = new Date();
    }

    await task.save();

    const populatedTask = await HousekeepingTask.findById(task._id)
      .populate('areaId', 'name building floor')
      .populate('assignedTo', 'employeeId firstName lastName')
      .populate('verifiedBy', 'username firstName lastName');

    return res.status(200).json({
      success: true,
      message: 'Housekeeping task updated successfully',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. SANITATION & CLEANING SUPPLIES
// ==========================================

export const getCleaningSupplies = async (req, res, next) => {
  try {
    const { category, lowStockOnly } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    let supplies = await CleaningSupply.find(query).sort({ name: 1 });

    if (lowStockOnly === 'true') {
      supplies = supplies.filter((s) => s.quantityInStock <= s.minimumAlertLevel);
    }

    const stats = {
      total: supplies.length,
      lowStock: supplies.filter((s) => s.quantityInStock <= s.minimumAlertLevel).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: supplies,
    });
  } catch (error) {
    next(error);
  }
};

export const createCleaningSupply = async (req, res, next) => {
  try {
    const {
      name,
      category = 'Detergent/Chemical',
      quantityInStock = 0,
      unit = 'Liters',
      minimumAlertLevel = 5,
      storageLocation = 'Janitorial Closet 1',
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Supply name is required' });
    }

    const existing = await CleaningSupply.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Supply item already exists' });
    }

    const item = await CleaningSupply.create({
      name: name.trim(),
      category,
      quantityInStock: Number(quantityInStock),
      unit,
      minimumAlertLevel: Number(minimumAlertLevel),
      storageLocation: storageLocation.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Cleaning supply item added successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCleaningSupply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantityInStock, minimumAlertLevel, storageLocation, category } = req.body;

    const item = await CleaningSupply.findByIdAndUpdate(
      id,
      {
        ...(quantityInStock !== undefined && { quantityInStock: Number(quantityInStock) }),
        ...(minimumAlertLevel !== undefined && { minimumAlertLevel: Number(minimumAlertLevel) }),
        ...(storageLocation && { storageLocation: storageLocation.trim() }),
        ...(category && { category }),
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Supply item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cleaning supply updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};
