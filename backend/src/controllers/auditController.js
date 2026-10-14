import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// CENTRAL SYSTEM AUDIT LOG CONTROLLER
// ==========================================

export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      resource,
      action,
      status,
      actorRole,
      search,
      startDate,
      endDate,
    } = req.query;

    let query = {};

    if (resource && resource !== 'All') {
      query.resource = resource;
    }
    if (action && action !== 'All') {
      query.action = { $regex: action, $options: 'i' };
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (actorRole && actorRole !== 'All') {
      query.actorRole = actorRole;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { action: searchRegex },
        { resource: searchRegex },
        { description: searchRegex },
        { ipAddress: searchRegex },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'username email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditStats = async (req, res, next) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const successfulActions = await AuditLog.countDocuments({ status: 'SUCCESS' });
    const failedActions = await AuditLog.countDocuments({ status: 'FAILURE' });

    // Distinct actors count
    const distinctActors = await AuditLog.distinct('actorId');

    // Aggregate by resource
    const resourceBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$resource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Aggregate by action
    const actionBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalLogs,
        successfulActions,
        failedActions,
        distinctActorsCount: distinctActors.length,
        resourceBreakdown,
        actionBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAuditLogs = async (req, res, next) => {
  try {
    const { resource, status, startDate, endDate } = req.query;
    let query = {};

    if (resource && resource !== 'All') query.resource = resource;
    if (status && status !== 'All') query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(1000);

    return res.status(200).json({
      success: true,
      count: logs.length,
      exportedAt: new Date().toISOString(),
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
