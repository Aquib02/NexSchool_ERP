import mongoose from 'mongoose';
import Notice from '../models/Notice.js';
import Notification from '../models/Notification.js';
import { logAudit } from '../utils/auditLogger.js';

// ==========================================
// NOTICES & CIRCULARS CONTROLLER
// ==========================================

export const getNotices = async (req, res, next) => {
  try {
    const { category, targetAudience, search, isPinned, activeOnly } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (targetAudience && targetAudience !== 'All') {
      query.$or = [{ targetAudience: 'All' }, { targetAudience: targetAudience }];
    }
    if (isPinned === 'true') {
      query.isPinned = true;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }
    if (activeOnly === 'true') {
      const now = new Date();
      query.publishDate = { $lte: now };
      query.$or = [{ expiryDate: null }, { expiryDate: { $gte: now } }];
    }

    const notices = await Notice.find(query)
      .populate('authorId', 'username firstName lastName')
      .populate('targetClasses', 'name code')
      .sort({ isPinned: -1, publishDate: -1 });

    const stats = {
      total: notices.length,
      pinned: notices.filter((n) => n.isPinned).length,
      emergency: notices.filter((n) => n.category === 'Emergency').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: notices,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoticeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id)
      .populate('authorId', 'username firstName lastName')
      .populate('targetClasses', 'name code');

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    return res.status(200).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    next(error);
  }
};

export const createNotice = async (req, res, next) => {
  try {
    const {
      title,
      content,
      category = 'General',
      targetAudience = ['All'],
      targetClasses = [],
      publishDate,
      expiryDate,
      attachmentUrl,
      isPinned = false,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required fields',
      });
    }

    const authorId = req.user?._id || new mongoose.Types.ObjectId();

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category,
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
      targetClasses: Array.isArray(targetClasses) ? targetClasses : [],
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      attachmentUrl: attachmentUrl?.trim() || null,
      isPinned: Boolean(isPinned),
      authorId,
    });

    const populatedNotice = await Notice.findById(notice._id).populate(
      'authorId',
      'username firstName lastName'
    );

    // Auto-fanout In-App Notification
    await Notification.create({
      recipientType: notice.targetAudience.includes('All') ? 'BroadcastAll' : 'Role',
      title: `Notice: ${notice.title}`,
      message: notice.content.substring(0, 120) + (notice.content.length > 120 ? '...' : ''),
      category: notice.category === 'Emergency' ? 'Emergency' : 'Notice',
      actionUrl: '/notices',
      channelDelivery: [{ channel: 'InApp', status: 'Delivered', deliveredAt: new Date() }],
    });

    // Audit log
    await logAudit({
      req,
      action: 'NOTICE_PUBLISHED',
      resource: 'Notice',
      resourceId: notice._id,
      diff: { after: { title: notice.title, category: notice.category, isPinned: notice.isPinned } },
    });

    return res.status(201).json({
      success: true,
      message: 'Notice published successfully',
      data: populatedNotice,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, targetAudience, targetClasses, isPinned, expiryDate, attachmentUrl } = req.body;

    const oldNotice = await Notice.findById(id);
    if (!oldNotice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const updatePayload = {
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(category && { category }),
      ...(targetAudience && { targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience] }),
      ...(targetClasses && { targetClasses }),
      ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
      ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      ...(attachmentUrl !== undefined && { attachmentUrl: attachmentUrl?.trim() || null }),
    };

    const updated = await Notice.findByIdAndUpdate(id, updatePayload, { new: true }).populate(
      'authorId',
      'username firstName lastName'
    );

    await logAudit({
      req,
      action: 'NOTICE_UPDATED',
      resource: 'Notice',
      resourceId: updated._id,
      diff: {
        before: { title: oldNotice.title, isPinned: oldNotice.isPinned },
        after: { title: updated.title, isPinned: updated.isPinned },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await logAudit({
      req,
      action: 'NOTICE_DELETED',
      resource: 'Notice',
      resourceId: notice._id,
      diff: { before: { title: notice.title } },
    });

    return res.status(200).json({
      success: true,
      message: 'Notice removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
