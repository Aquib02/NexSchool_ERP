import mongoose from 'mongoose';
import AdmissionEnquiry from '../models/AdmissionEnquiry.js';
import AdmissionApplication from '../models/AdmissionApplication.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Section from '../models/Section.js';
import AcademicSession from '../models/AcademicSession.js';
import { provisionStudentAndParentAccounts } from '../utils/accountProvisioner.js';

// Helper to resolve or get active academic session
const resolveSession = async (sessionId) => {
  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    const found = await AcademicSession.findById(sessionId);
    if (found) return found._id;
  }
  let active = await AcademicSession.findOne({ isCurrent: true });
  if (!active) active = await AcademicSession.findOne().sort({ createdAt: -1 });
  if (!active) {
    const year = new Date().getFullYear();
    active = await AcademicSession.create({
      name: `${year}-${year + 1}`,
      startDate: new Date(year, 3, 1),
      endDate: new Date(year + 1, 2, 31),
      isCurrent: true,
      status: 'active',
    });
  }
  return active._id;
};

// Helper for generating serial codes
const generateSerial = (prefix) => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
};

// ==========================================
// 1. ENQUIRIES CONTROLLERS
// ==========================================

export const createEnquiry = async (req, res, next) => {
  try {
    const {
      candidateName,
      parentName,
      phone,
      email,
      targetClassId,
      academicSessionId,
      source = 'Walk-in',
      followUpDate,
      notes,
    } = req.body;

    if (!candidateName || !parentName || !phone || !targetClassId) {
      return res.status(400).json({
        success: false,
        message: 'candidateName, parentName, phone, and targetClassId are required',
      });
    }

    const session = await resolveSession(academicSessionId);
    const enquiryNumber = generateSerial('ENQ');

    const enquiry = await AdmissionEnquiry.create({
      enquiryNumber,
      candidateName: candidateName.trim(),
      parentName: parentName.trim(),
      phone: phone.trim(),
      email: email?.trim().toLowerCase() || null,
      targetClassId,
      academicSessionId: session,
      source,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      notes: notes?.trim() || null,
      handledBy: req.user?._id || null,
    });

    const populated = await AdmissionEnquiry.findById(enquiry._id)
      .populate('targetClassId', 'name code')
      .populate('academicSessionId', 'name');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Admission enquiry recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getEnquiries = async (req, res, next) => {
  try {
    const { status, targetClassId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (targetClassId) filter.targetClassId = targetClassId;
    if (search) {
      filter.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { enquiryNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [enquiries, total] = await Promise.all([
      AdmissionEnquiry.find(filter)
        .populate('targetClassId', 'name code')
        .populate('academicSessionId', 'name')
        .populate('handledBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdmissionEnquiry.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: enquiries.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, followUpDate } = req.body;

    const enquiry = await AdmissionEnquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status) enquiry.status = status;
    if (notes) enquiry.notes = notes.trim();
    if (followUpDate) enquiry.followUpDate = new Date(followUpDate);
    enquiry.handledBy = req.user?._id || enquiry.handledBy;

    await enquiry.save();

    res.status(200).json({
      success: true,
      data: enquiry,
      message: 'Enquiry status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. APPLICATIONS CONTROLLERS
// ==========================================

export const createApplication = async (req, res, next) => {
  try {
    const {
      enquiryId,
      academicSessionId,
      targetClassId,
      candidate,
      parentDetails,
      previousSchool,
    } = req.body;

    if (!targetClassId || !candidate?.firstName || !candidate?.lastName || !parentDetails?.primaryPhone) {
      return res.status(400).json({
        success: false,
        message: 'targetClassId, candidate firstName/lastName, and parent primaryPhone are required',
      });
    }

    const session = await resolveSession(academicSessionId);
    const applicationNumber = generateSerial('APP');

    const application = await AdmissionApplication.create({
      applicationNumber,
      enquiryId: enquiryId || null,
      academicSessionId: session,
      targetClassId,
      candidate: {
        firstName: candidate.firstName.trim(),
        lastName: candidate.lastName.trim(),
        dateOfBirth: new Date(candidate.dateOfBirth || '2015-01-01'),
        gender: candidate.gender || 'Other',
        bloodGroup: candidate.bloodGroup || 'Unknown',
      },
      parentDetails: {
        fatherName: parentDetails.fatherName?.trim() || '',
        fatherPhone: parentDetails.fatherPhone?.trim() || '',
        fatherEmail: parentDetails.fatherEmail?.trim().toLowerCase() || '',
        fatherOccupation: parentDetails.fatherOccupation?.trim() || '',
        motherName: parentDetails.motherName?.trim() || '',
        motherPhone: parentDetails.motherPhone?.trim() || '',
        primaryPhone: parentDetails.primaryPhone.trim(),
        address: parentDetails.address || {},
      },
      previousSchool: previousSchool || {},
      status: 'Submitted',
    });

    // If linked to an enquiry, update enquiry status
    if (enquiryId) {
      await AdmissionEnquiry.findByIdAndUpdate(enquiryId, { status: 'Application Submitted' });
    }

    const populated = await AdmissionApplication.findById(application._id)
      .populate('targetClassId', 'name code')
      .populate('academicSessionId', 'name');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Admission application submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const { status, targetClassId, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (targetClassId) filter.targetClassId = targetClassId;
    if (search) {
      filter.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'candidate.firstName': { $regex: search, $options: 'i' } },
        { 'candidate.lastName': { $regex: search, $options: 'i' } },
        { 'parentDetails.primaryPhone': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      AdmissionApplication.find(filter)
        .populate('targetClassId', 'name code')
        .populate('academicSessionId', 'name')
        .populate('convertedStudentId', 'studentId admissionNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdmissionApplication.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: applications.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await AdmissionApplication.findById(id)
      .populate('targetClassId', 'name code')
      .populate('academicSessionId', 'name')
      .populate('enquiryId')
      .populate('convertedStudentId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const application = await AdmissionApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (status) application.status = status;
    if (remarks && application.entranceTest) application.entranceTest.remarks = remarks;

    await application.save();

    res.status(200).json({
      success: true,
      data: application,
      message: `Application status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

export const recordEntranceMarks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { marksObtained, totalMarks = 100, scheduledDate, remarks } = req.body;

    const application = await AdmissionApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const marks = Number(marksObtained);
    const total = Number(totalMarks);
    const passThreshold = total * 0.4; // 40% passing standard
    const isPassed = marks >= passThreshold;

    application.entranceTest = {
      scheduledDate: scheduledDate ? new Date(scheduledDate) : application.entranceTest?.scheduledDate,
      totalMarks: total,
      marksObtained: marks,
      isPassed,
      remarks: remarks?.trim() || null,
    };

    if (isPassed) {
      application.status = 'Selected';
    }

    await application.save();

    res.status(200).json({
      success: true,
      data: application,
      message: `Entrance test marks recorded. Candidate is ${isPassed ? 'Selected' : 'Not Selected'}.`,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. CONVERT APPLICATION TO CENTRAL STUDENT
// ==========================================

export const convertToStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sectionId, rollNumber, admissionDate } = req.body;

    const application = await AdmissionApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'Converted to Student' || application.convertedStudentId) {
      return res.status(400).json({
        success: false,
        message: 'This application has already been converted into a student profile',
      });
    }

    // 1. Resolve or Create Parent Profile (Sibling Check via primaryPhone)
    const phone = application.parentDetails.primaryPhone;
    let parent = await Parent.findOne({ primaryContactNumber: phone });

    if (!parent) {
      const parentCount = await Parent.countDocuments();
      const parentId = `PAR-${new Date().getFullYear()}-${String(parentCount + 1).padStart(4, '0')}`;
      parent = await Parent.create({
        parentId,
        fatherName: application.parentDetails.fatherName || '',
        fatherPhone: application.parentDetails.fatherPhone || phone,
        fatherEmail: application.parentDetails.fatherEmail || '',
        fatherOccupation: application.parentDetails.fatherOccupation || '',
        motherName: application.parentDetails.motherName || '',
        motherPhone: application.parentDetails.motherPhone || '',
        primaryContactNumber: phone,
        address: application.parentDetails.address || {},
      });
    }

    // 2. Generate Student Identifiers
    const studentCount = await Student.countDocuments();
    const finalStudentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`;
    const finalAdmissionNo = `ADM-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`;

    // Auto-resolve section or roll number if not provided
    let targetSectionId = sectionId;
    if (!targetSectionId) {
      let existingSection = await Section.findOne({ classId: application.targetClassId });
      if (!existingSection) {
        existingSection = await Section.create({
          name: 'A',
          classId: application.targetClassId,
          capacity: 40,
        });
      }
      targetSectionId = existingSection._id;
    }

    const assignedRollNumber = Number(rollNumber) || (studentCount % 40) + 1;

    // 3. Create Central Student Profile
    const student = await Student.create({
      studentId: finalStudentId,
      admissionNumber: finalAdmissionNo,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      firstName: application.candidate.firstName,
      lastName: application.candidate.lastName,
      dateOfBirth: application.candidate.dateOfBirth,
      gender: application.candidate.gender,
      bloodGroup: application.candidate.bloodGroup,
      currentClass: application.targetClassId,
      currentSection: targetSectionId,
      classId: application.targetClassId,
      sectionId: targetSectionId,
      rollNumber: assignedRollNumber,
      academicSessionId: application.academicSessionId,
      parentId: parent._id,
      emergencyContact: {
        name: application.parentDetails.fatherName || application.parentDetails.motherName || 'Guardian',
        relationship: application.parentDetails.fatherName ? 'Father' : 'Guardian',
        phone: phone,
      },
      parents: [
        {
          parentId: parent._id,
          relationship: application.parentDetails.fatherName ? 'Father' : 'Guardian',
          isPrimaryContact: true,
        },
      ],
      contact: {
        phone: phone,
        email: application.parentDetails.fatherEmail || null,
      },
      address: application.parentDetails.address || {},
      status: 'Active',
    });

    // 4. Link Student to Parent (preserving siblings)
    if (!parent.students.includes(student._id)) {
      parent.students.push(student._id);
      await parent.save();
    }

    // 5. Update Application Status
    application.status = 'Converted to Student';
    application.convertedStudentId = student._id;
    await application.save();

    // 6. Automatically generate student and father credentials
    const credentials = await provisionStudentAndParentAccounts({
      student,
      parent,
      studentEmail: student.contact?.email,
      parentEmail: parent.fatherEmail || parent.email,
    });

    res.status(201).json({
      success: true,
      message: `Applicant converted to Central Student (${student.studentId}) successfully`,
      data: {
        student,
        parent,
        application,
        credentials,
      },
    });
  } catch (error) {
    next(error);
  }
};
