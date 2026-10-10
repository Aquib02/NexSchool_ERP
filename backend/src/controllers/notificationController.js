import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// ==========================================
// NOTIFICATIONS CONTROLLER
// ==========================================

export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role?.name;

    const query = {
      $or: [
        { recipientType: 'BroadcastAll' },
        ...(userId ? [{ recipientId: userId }] : []),
        ...(userRole ? [{ roleTarget: userRole }] : []),
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      const userId = req.user?._id;
      const userRole = req.user?.role?.name;

      const query = {
        isRead: false,
        $or: [
          { recipientType: 'BroadcastAll' },
          ...(userId ? [{ recipientId: userId }] : []),
          ...(userRole ? [{ roleTarget: userRole }] : []),
        ],
      };

      await Notification.updateMany(query, {
        $set: { isRead: true, readAt: new Date() },
      });

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const createBroadcastNotification = async (req, res, next) => {
  try {
    const {
      title,
      message,
      category = 'System',
      recipientType = 'BroadcastAll',
      roleTarget,
      actionUrl,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required fields',
      });
    }

    const notification = await Notification.create({
      recipientType,
      roleTarget: recipientType === 'Role' ? roleTarget : null,
      title: title.trim(),
      message: message.trim(),
      category,
      actionUrl: actionUrl?.trim() || null,
      channelDelivery: [
        {
          channel: 'InApp',
          status: 'Delivered',
          deliveredAt: new Date(),
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Notification broadcasted successfully',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
