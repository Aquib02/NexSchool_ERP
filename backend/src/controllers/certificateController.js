import crypto from 'crypto';
import Certificate from '../models/Certificate.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import Employee from '../models/Employee.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Serial number generator helper
const generateCertNumber = (prefix) => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${rand}`;
};

export const generateCertificate = asyncHandler(async (req, res) => {
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden('Students are not authorized to issue or generate certificates.');
  }

  const {
    certificateType = 'TRANSFER_CERTIFICATE',
    studentId,
    conduct = 'Exemplary',
    reasonForLeaving = 'Higher Education / Relocation',
    dateOfLeaving = new Date(),
    feeStatus = 'All Dues Cleared',
    customRemarks,
  } = req.body;

  if (!studentId) {
    throw ApiError.badRequest('Student ID is required');
  }

  const student = await Student.findById(studentId)
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('parentId', 'fatherName motherName');

  if (!student) {
    throw ApiError.notFound('Student record not found');
  }

  const prefixes = {
    TRANSFER_CERTIFICATE: 'TC',
    BONAFIDE_CERTIFICATE: 'BNF',
    CHARACTER_CERTIFICATE: 'CHR',
    MERIT_CERTIFICATE: 'MRT',
    FEE_CLEARANCE_CERTIFICATE: 'FCC',
  };

  const certNumber = generateCertNumber(prefixes[certificateType] || 'DOC');
  const verificationHash = crypto
    .createHash('sha256')
    .update(`${certNumber}-${student.admissionNumber}-${Date.now()}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();

  const qrCodeString = `NEXSCHOOL-VERIFY:CERT=${certNumber}:HASH=${verificationHash}:STU=${student.admissionNumber}`;

  const cert = await Certificate.create({
    certificateNumber: certNumber,
    certificateType,
    studentId: student._id,
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNumber: student.admissionNumber,
    academicSessionId: student.academicSessionId,
    issueDate: new Date(),
    details: {
      className: student.classId?.name || 'Class 10',
      sectionName: student.sectionId?.name || 'A',
      conduct,
      reasonForLeaving,
      dateOfAdmission: student.admissionDate || student.createdAt,
      dateOfLeaving: new Date(dateOfLeaving),
      feeStatus,
      customRemarks:
        customRemarks ||
        `This is to certify that ${student.firstName} ${student.lastName} was a bonafide student of NexSchool Academy.`,
    },
    verificationHash,
    qrCodeString,
    status: 'Active',
    issuedBy: req.user?._id,
  });

  return ApiResponse.created(res, cert, `${certificateType.replace(/_/g, ' ')} generated successfully`);
});

export const getCertificates = asyncHandler(async (req, res) => {
  const { certificateType, studentId, status } = req.query;
  const filter = {};
  if (certificateType) filter.certificateType = certificateType;
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;

  // STRICT PRIVACY SCOPING: Students only see their own certificates
  if (req.user?.role?.name === 'STUDENT') {
    if (!req.user.studentId) {
      return ApiResponse.ok(res, [], 'Certificates retrieved successfully');
    }
    filter.studentId = req.user.studentId;
  }

  const certs = await Certificate.find(filter)
    .sort({ createdAt: -1 })
    .populate('studentId', 'firstName lastName admissionNumber rollNumber')
    .populate('issuedBy', 'username');

  return ApiResponse.ok(res, certs, 'Certificates retrieved successfully');
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const cert = await Certificate.findOne({
    $or: [{ certificateNumber: code.toUpperCase() }, { verificationHash: code.toUpperCase() }],
  })
    .populate('studentId', 'firstName lastName admissionNumber dateOfBirth')
    .populate('issuedBy', 'username');

  if (!cert) {
    throw ApiError.notFound('Certificate verification failed: No matching record found in school registry');
  }

  return ApiResponse.ok(
    res,
    {
      isValid: cert.status === 'Active',
      certificateNumber: cert.certificateNumber,
      certificateType: cert.certificateType,
      studentName: cert.studentName,
      admissionNumber: cert.admissionNumber,
      issueDate: cert.issueDate,
      verificationHash: cert.verificationHash,
      details: cert.details,
    },
    'Certificate authenticity verified'
  );
});

export const generateBulkIDCards = asyncHandler(async (req, res) => {
  const { classId, userType = 'Student' } = req.query;

  if (req.user?.role?.name === 'STUDENT') {
    if (userType === 'Staff') {
      throw ApiError.forbidden('Students are not authorized to view staff ID cards.');
    }
  }

  if (userType === 'Staff') {
    const employees = await Employee.find().populate('departmentId', 'name').populate('designationId', 'title');
    const cards = employees.map((emp) => ({
      id: emp._id,
      type: 'Staff',
      code: emp.employeeCode || 'EMP-100',
      fullName: `${emp.firstName} ${emp.lastName}`,
      subTitle: emp.designationId?.title || 'Faculty',
      department: emp.departmentId?.name || 'Academic Dept',
      bloodGroup: emp.bloodGroup || 'O+',
      emergencyPhone: emp.phone || '+91-9876543210',
      qrString: `NEX-ID:STAFF:${emp.employeeCode}:${emp._id}`,
    }));
    return ApiResponse.ok(res, cards, 'Staff ID cards data ready for printing');
  }

  const filter = {};
  if (req.user?.role?.name === 'STUDENT') {
    if (!req.user.studentId) {
      return ApiResponse.ok(res, [], 'Student ID cards data ready for printing');
    }
    filter._id = req.user.studentId;
  } else if (classId) {
    filter.classId = classId;
  }

  const students = await Student.find(filter)
    .limit(30)
    .populate('classId', 'name')
    .populate('sectionId', 'name');

  const cards = students.map((stu) => ({
    id: stu._id,
    type: 'Student',
    code: stu.admissionNumber || 'ADM-2026',
    fullName: `${stu.firstName} ${stu.lastName}`,
    subTitle: `Class ${stu.classId?.name || '10'} - ${stu.sectionId?.name || 'A'}`,
    rollNumber: stu.rollNumber || 1,
    bloodGroup: stu.bloodGroup || 'B+',
    emergencyPhone: stu.emergencyContact?.phone || '+91-9876543210',
    qrString: `NEX-ID:STUDENT:${stu.admissionNumber}:${stu._id}`,
  }));

  return ApiResponse.ok(res, cards, 'Student ID cards data ready for printing');
});

export const generateExamHallTickets = asyncHandler(async (req, res) => {
  const { classId, examTitle = 'Annual Board Examination 2026' } = req.query;

  const filter = {};
  if (req.user?.role?.name === 'STUDENT') {
    if (!req.user.studentId) {
      return ApiResponse.ok(res, [], 'Exam Admit Cards / Hall tickets generated successfully');
    }
    filter._id = req.user.studentId;
  } else if (classId) {
    filter.classId = classId;
  }

  const students = await Student.find(filter)
    .limit(30)
    .populate('classId', 'name')
    .populate('sectionId', 'name');

  const defaultSchedule = [
    { date: '15 Mar 2026', subject: 'Mathematics', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
    { date: '18 Mar 2026', subject: 'English Language', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
    { date: '21 Mar 2026', subject: 'Science & Lab', time: '09:30 AM - 12:30 PM', room: 'Hall B (Desk 08)' },
    { date: '24 Mar 2026', subject: 'Social Studies', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
  ];

  const tickets = students.map((stu) => ({
    ticketNumber: `HT-${stu.admissionNumber || 'ADM'}-2026`,
    studentId: stu._id,
    studentName: `${stu.firstName} ${stu.lastName}`,
    admissionNumber: stu.admissionNumber,
    rollNumber: stu.rollNumber || 1,
    className: stu.classId?.name || 'Class 10',
    sectionName: stu.sectionId?.name || 'A',
    examTitle,
    centerName: 'NexSchool Main Campus Examination Wing',
    schedule: defaultSchedule,
    rules: [
      'Candidates must carry valid Hall Ticket & ID Card.',
      'Entry is strictly prohibited 15 minutes after examination begins.',
      'Electronic gadgets and programmable calculators are forbidden.',
    ],
  }));

  return ApiResponse.ok(res, tickets, 'Exam Admit Cards / Hall tickets generated successfully');
});
