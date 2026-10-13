import mongoose from 'mongoose';
import CommunicationLog from '../models/CommunicationLog.js';
import PTMSlot from '../models/PTMSlot.js';
import ChatMessage from '../models/ChatMessage.js';
import Student from '../models/Student.js';
import MessagingService from '../services/messagingService.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// ==========================================
// 1. WHATSAPP & SMS COMMUNICATIONS
// ==========================================

export const getCommunicationLogs = asyncHandler(async (req, res) => {
  const { channel, triggerEvent, status, limit = 50 } = req.query;
  const filter = {};

  if (channel) filter.channel = channel;
  if (triggerEvent) filter.triggerEvent = triggerEvent;
  if (status) filter.status = status;

  const logs = await CommunicationLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate('sentBy', 'username');

  return ApiResponse.ok(res, logs, 'Communication logs retrieved successfully');
});

export const sendBroadcast = asyncHandler(async (req, res) => {
  const {
    channel = 'WhatsApp',
    targetGroup = 'All_Parents',
    messageBody,
    triggerEvent = 'GENERAL_CIRCULAR',
  } = req.body;

  if (!messageBody || messageBody.trim().length === 0) {
    throw ApiError.badRequest('Message body is required');
  }

  // Generate batch log
  let recipients = [];
  if (targetGroup === 'All_Parents') {
    recipients = [
      { phone: '+91-9876543210', name: 'Parent Group (Primary)' },
      { phone: '+91-9812345678', name: 'Parent Group (Secondary)' },
      { phone: '+91-9988776655', name: 'Parent Council' },
    ];
  } else if (targetGroup === 'Fee_Defaulters') {
    recipients = [
      { phone: '+91-9871112233', name: 'Pending Dues Q2' },
      { phone: '+91-9822223344', name: 'Pending Dues Bus' },
    ];
  } else {
    recipients = [{ phone: '+91-9900011223', name: `${targetGroup} Representative` }];
  }

  const logsCreated = [];
  for (const recipient of recipients) {
    if (channel === 'WhatsApp') {
      const log = await MessagingService.sendWhatsApp({
        toPhone: recipient.phone,
        recipientName: recipient.name,
        recipientType: targetGroup,
        triggerEvent,
        messageBody,
        sentBy: req.user?._id,
      });
      logsCreated.push(log);
    } else {
      const log = await MessagingService.sendSMS({
        toPhone: recipient.phone,
        recipientName: recipient.name,
        recipientType: targetGroup,
        triggerEvent,
        messageBody,
        sentBy: req.user?._id,
      });
      logsCreated.push(log);
    }
  }

  return ApiResponse.created(
    res,
    { dispatchedCount: logsCreated.length, sampleLogs: logsCreated },
    `Broadcast successfully dispatched via ${channel} to ${targetGroup}`
  );
});

export const triggerAutomatedAlert = asyncHandler(async (req, res) => {
  const { alertType, studentName, studentId, amountDue, phone = '+91-9876501234' } = req.body;

  let body = '';
  let triggerEvent = 'GENERAL_CIRCULAR';

  if (alertType === 'ATTENDANCE_ABSENT') {
    triggerEvent = 'ATTENDANCE_ABSENT';
    body = `Dear Parent, your child ${studentName || 'Student'} has been marked ABSENT today (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). If this is unexpected, please contact the class teacher immediately. - NexSchool Admin`;
  } else if (alertType === 'FEE_REMINDER') {
    triggerEvent = 'FEE_REMINDER';
    body = `Dear Parent, this is a gentle reminder that school fees amounting to $${amountDue || '750'} for ${studentName || 'your ward'} are due in 3 days. Please pay online via the Parent Portal to avoid late charges. - Accounts Dept`;
  } else {
    body = `Important school notice for ${studentName || 'your ward'}: Please review the newly published circular on the ERP portal.`;
  }

  const log = await MessagingService.sendWhatsApp({
    toPhone: phone,
    recipientName: studentName ? `${studentName}'s Parent` : 'Parent',
    recipientType: 'Parent',
    triggerEvent,
    messageBody: body,
    sentBy: req.user?._id,
  });

  return ApiResponse.created(res, log, `Automated alert (${alertType}) dispatched successfully`);
});

// ==========================================
// 2. PARENT-TEACHER MEETING (PTM) SLOTS
// ==========================================

export const getPTMSlots = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    filter.date = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  const slots = await PTMSlot.find(filter)
    .sort({ date: 1, startTime: 1 })
    .populate('teacherId', 'firstName lastName email employeeCode')
    .populate('classId', 'name');

  return ApiResponse.ok(res, slots, 'PTM sessions retrieved successfully');
});

export const createPTMSlot = asyncHandler(async (req, res) => {
  const {
    title,
    teacherId,
    teacherName,
    classId,
    date,
    startTime,
    endTime,
    slotDurationMinutes = 15,
    meetingMode = 'In-Person',
    meetingLocationOrLink,
    maxCapacity = 10,
    remarks,
  } = req.body;

  if (!title || !date || !startTime || !endTime) {
    throw ApiError.badRequest('Title, Date, Start Time, and End Time are required');
  }

  const newSlot = await PTMSlot.create({
    title,
    teacherId: teacherId || req.user?._id,
    teacherName: teacherName || req.user?.username || 'Class Teacher',
    classId: classId || null,
    date: new Date(date),
    startTime,
    endTime,
    slotDurationMinutes,
    meetingMode,
    meetingLocationOrLink: meetingLocationOrLink || 'Classroom / Auditorium',
    maxCapacity,
    remarks,
    bookings: [],
  });

  return ApiResponse.created(res, newSlot, 'PTM session created successfully');
});

export const bookPTMSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { parentId, parentName, studentId, studentName, timeSlot, notes } = req.body;

  const slot = await PTMSlot.findById(id);
  if (!slot) {
    throw ApiError.notFound('PTM session not found');
  }

  if (slot.bookings.length >= slot.maxCapacity) {
    throw ApiError.badRequest('This PTM session is fully booked');
  }

  slot.bookings.push({
    parentId: parentId || req.user?._id,
    parentName: parentName || req.user?.username || 'Guardian',
    studentId: studentId || new mongoose.Types.ObjectId(),
    studentName: studentName || 'Student Ward',
    timeSlot: timeSlot || '09:00 AM - 09:15 AM',
    notes,
    status: 'Booked',
  });

  await slot.save();

  return ApiResponse.ok(res, slot, 'PTM slot booked successfully');
});

// ==========================================
// 3. IN-APP CHAT & MESSAGING
// ==========================================

export const getChatMessages = asyncHandler(async (req, res) => {
  const { channel = 'GENERAL', limit = 100 } = req.query;

  const messages = await ChatMessage.find({ channelName: channel })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate('senderId', 'username');

  return ApiResponse.ok(res, messages.reverse(), 'Chat history retrieved successfully');
});

export const sendChatMessage = asyncHandler(async (req, res) => {
  const { message, channelName = 'GENERAL', receiverId } = req.body;

  if (!message || message.trim().length === 0) {
    throw ApiError.badRequest('Message cannot be empty');
  }

  const chat = await ChatMessage.create({
    senderId: req.user?._id,
    senderName: req.user?.username || 'User',
    senderRole: req.user?.role?.name || 'STAFF',
    receiverId: receiverId || null,
    channelName,
    message: message.trim(),
  });

  return ApiResponse.created(res, chat, 'Message sent successfully');
});
