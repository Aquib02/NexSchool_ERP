import mongoose from 'mongoose';
import Visitor from '../models/Visitor.js';
import GatePass from '../models/GatePass.js';
import SecurityIncident from '../models/SecurityIncident.js';
import Student from '../models/Student.js';

const generateVisitorPass = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VIS-${year}-${rand}`;
};

const generateGatePassNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GP-${year}-${rand}`;
};

const generateIncidentNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INC-${year}-${rand}`;
};

// ==========================================
// 1. CAMPUS VISITORS
// ==========================================

export const getVisitors = async (req, res, next) => {
  try {
    const { status, visitingType, search, date } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (visitingType && visitingType !== 'All') {
      query.visitingType = visitingType;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ visitorName: searchRegex }, { phone: searchRegex }, { passNumber: searchRegex }];
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.entryTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const visitors = await Visitor.find(query)
      .populate('employeeId', 'employeeId firstName lastName')
      .populate('studentId', 'admissionNumber firstName lastName')
      .populate('securityGuardId', 'username firstName lastName')
      .sort({ entryTime: -1 });

    const stats = {
      total: visitors.length,
      insideCampus: visitors.filter((v) => v.status === 'Inside Campus').length,
      exited: visitors.filter((v) => v.status === 'Exited').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: visitors,
    });
  } catch (error) {
    next(error);
  }
};

export const createVisitorPass = async (req, res, next) => {
  try {
    const {
      visitorName,
      phone,
      idProofType = 'National ID / Aadhaar',
      idProofNumber,
      purpose,
      visitingType = 'General Administration',
      employeeId,
      studentId,
      vehicleNumber,
      gateNumber = 'Gate 1',
    } = req.body;

    if (!visitorName || !phone || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'visitorName, phone, and purpose are required',
      });
    }

    const pass = await Visitor.create({
      passNumber: generateVisitorPass(),
      visitorName: visitorName.trim(),
      phone: phone.trim(),
      idProofType,
      idProofNumber: idProofNumber?.trim(),
      purpose: purpose.trim(),
      visitingType,
      employeeId: employeeId && mongoose.Types.ObjectId.isValid(employeeId) ? employeeId : null,
      studentId: studentId && mongoose.Types.ObjectId.isValid(studentId) ? studentId : null,
      vehicleNumber: vehicleNumber?.trim()?.toUpperCase(),
      entryTime: new Date(),
      gateNumber,
      securityGuardId: req.user?._id || new mongoose.Types.ObjectId(),
      status: 'Inside Campus',
    });

    const populatedPass = await Visitor.findById(pass._id)
      .populate('employeeId', 'employeeId firstName lastName')
      .populate('studentId', 'admissionNumber firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Visitor pass issued successfully',
      data: populatedPass,
    });
  } catch (error) {
    next(error);
  }
};

export const checkoutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record not found' });
    }

    if (visitor.status === 'Exited') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked out' });
    }

    visitor.exitTime = new Date();
    visitor.status = 'Exited';
    await visitor.save();

    return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully',
      data: visitor,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GATE PASSES (STUDENT & STAFF)
// ==========================================

export const getGatePasses = async (req, res, next) => {
  try {
    const { passType, status, studentId, date } = req.query;
    let query = {};

    if (passType && passType !== 'All') {
      query.passType = passType;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      query.studentId = studentId;
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const passes = await GatePass.find(query)
      .populate({
        path: 'studentId',
        select: 'admissionNumber firstName lastName classId sectionId emergencyContact',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .populate('employeeId', 'employeeId firstName lastName')
      .populate('authorizedBy', 'username firstName lastName')
      .sort({ departureTime: -1 });

    const stats = {
      total: passes.length,
      authorized: passes.filter((p) => p.status === 'Authorized').length,
      departed: passes.filter((p) => p.status === 'Departed').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: passes,
    });
  } catch (error) {
    next(error);
  }
};

export const createGatePass = async (req, res, next) => {
  try {
    const {
      passType = 'Student Early Exit',
      studentId,
      employeeId,
      reason,
      accompaniedByName,
      accompaniedByPhone,
      accompaniedByIdVerified = false,
      gateNumber = 'Main Gate',
    } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for gate pass is required' });
    }

    if (passType === 'Student Early Exit' && (!studentId || !mongoose.Types.ObjectId.isValid(studentId))) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required for student early exit' });
    }

    // Verify student exists
    if (passType === 'Student Early Exit') {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
    }

    const gatePass = await GatePass.create({
      passNumber: generateGatePassNumber(),
      passType,
      studentId: passType === 'Student Early Exit' ? studentId : null,
      employeeId: passType === 'Staff Departure' ? employeeId : null,
      reason: reason.trim(),
      authorizedBy: req.user?._id || new mongoose.Types.ObjectId(),
      accompaniedByName: accompaniedByName?.trim(),
      accompaniedByPhone: accompaniedByPhone?.trim(),
      accompaniedByIdVerified,
      departureTime: new Date(),
      gateNumber,
      securityGuardId: req.user?._id || new mongoose.Types.ObjectId(),
      status: 'Authorized',
    });

    const populatedPass = await GatePass.findById(gatePass._id)
      .populate('studentId', 'admissionNumber firstName lastName classId sectionId emergencyContact')
      .populate('authorizedBy', 'username firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Gate pass generated successfully',
      data: populatedPass,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGatePassStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Authorized', 'Departed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Authorized, Departed, or Cancelled',
      });
    }

    const pass = await GatePass.findByIdAndUpdate(id, { status }, { new: true })
      .populate('studentId', 'admissionNumber firstName lastName')
      .populate('authorizedBy', 'username firstName lastName');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Gate pass not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Gate pass status updated',
      data: pass,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. SECURITY INCIDENTS
// ==========================================

export const getSecurityIncidents = async (req, res, next) => {
  try {
    const { severity, status, incidentType } = req.query;
    let query = {};

    if (severity && severity !== 'All') {
      query.severity = severity;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (incidentType && incidentType !== 'All') {
      query.incidentType = incidentType;
    }

    const incidents = await SecurityIncident.find(query)
      .populate('reportedBy', 'username firstName lastName')
      .sort({ incidentDate: -1 });

    const stats = {
      total: incidents.length,
      reported: incidents.filter((i) => i.status === 'Reported').length,
      investigating: incidents.filter((i) => i.status === 'Investigating').length,
      resolved: incidents.filter((i) => i.status === 'Resolved').length,
      critical: incidents.filter((i) => i.severity === 'Critical').length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
};

export const createSecurityIncident = async (req, res, next) => {
  try {
    const {
      title,
      incidentType = 'Other',
      severity = 'Medium',
      location,
      description,
      partiesInvolved,
      actionTaken,
    } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'title, location, and description are required',
      });
    }

    const incident = await SecurityIncident.create({
      incidentNumber: generateIncidentNumber(),
      title: title.trim(),
      incidentType,
      severity,
      incidentDate: new Date(),
      location: location.trim(),
      description: description.trim(),
      partiesInvolved: partiesInvolved?.trim(),
      reportedBy: req.user?._id || new mongoose.Types.ObjectId(),
      actionTaken: actionTaken?.trim(),
      status: 'Reported',
    });

    const populatedIncident = await SecurityIncident.findById(incident._id).populate(
      'reportedBy',
      'username firstName lastName'
    );

    return res.status(201).json({
      success: true,
      message: 'Security incident logged successfully',
      data: populatedIncident,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, actionTaken } = req.body;

    const validStatuses = ['Reported', 'Investigating', 'Resolved', 'Escalated to Authorities'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid incident status' });
    }

    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (actionTaken !== undefined) updatePayload.actionTaken = actionTaken.trim();

    const incident = await SecurityIncident.findByIdAndUpdate(id, updatePayload, { new: true }).populate(
      'reportedBy',
      'username firstName lastName'
    );

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident record not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Incident record updated successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};
