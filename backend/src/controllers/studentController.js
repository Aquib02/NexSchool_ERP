import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import AcademicSession from '../models/AcademicSession.js';
import Document from '../models/Document.js';

// ==================== GET STUDENTS (SEARCH, FILTER, PAGINATE) ====================
export const getStudents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    classId,
    sectionId,
    status = 'Active',
    academicSessionId,
  } = req.query;

  const query = {};

  if (status && status !== 'All') {
    query.status = status;
  }

  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (academicSessionId) query.academicSessionId = academicSessionId;

  // Search filter across name, student ID, and admission number
  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { studentId: searchRegex },
      { admissionNumber: searchRegex },
      { 'contact.phone': searchRegex },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [total, students] = await Promise.all([
    Student.countDocuments(query),
    Student.find(query)
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .populate('academicSessionId', 'name isCurrent status')
      .populate('parentId', 'fatherName motherName guardianName primaryContactNumber')
      .sort({ classId: 1, sectionId: 1, rollNumber: 1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.ok(
    res,
    {
      students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
    'Students retrieved successfully'
  );
});

// ==================== GET SINGLE STUDENT 360 PROFILE ====================
export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('classId', 'name code')
    .populate('sectionId', 'name roomNumber')
    .populate('academicSessionId', 'name startDate endDate')
    .populate('parentId');

  if (!student) {
    throw ApiError.notFound('Student record not found');
  }

  // Fetch linked documents
  const documents = await Document.find({
    entityType: 'Student',
    entityId: student._id,
  }).sort({ createdAt: -1 });

  return ApiResponse.ok(
    res,
    {
      student,
      documents,
    },
    'Student 360 profile retrieved successfully'
  );
});

// ==================== CREATE STUDENT ====================
export const createStudent = asyncHandler(async (req, res) => {
  const {
    studentId,
    admissionNumber,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bloodGroup,
    classId,
    sectionId,
    rollNumber,
    academicSessionId,
    photo,
    contact,
    address,
    previousSchool,
    emergencyContact,
    // Parent profile options:
    parentId,
    parentData,
  } = req.body;

  // 1. Resolve Academic Session (default to current if not passed)
  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    if (!currentSession) {
      throw ApiError.badRequest('No active academic session found. Please specify or create one.');
    }
    targetSessionId = currentSession._id;
  }

  // 2. Generate unique human-readable studentId if not provided
  let finalStudentId = studentId;
  if (!finalStudentId) {
    const count = await Student.countDocuments();
    finalStudentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }

  let finalAdmissionNo = admissionNumber;
  if (!finalAdmissionNo) {
    const count = await Student.countDocuments();
    finalAdmissionNo = `ADM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }

  // Check unique constraints
  const duplicateCheck = await Student.findOne({
    $or: [{ studentId: finalStudentId }, { admissionNumber: finalAdmissionNo }],
  });
  if (duplicateCheck) {
    throw ApiError.conflict('A student with this Student ID or Admission Number already exists.');
  }

  // Check roll number uniqueness in section
  const rollConflict = await Student.findOne({
    classId,
    sectionId,
    rollNumber,
    academicSessionId: targetSessionId,
    status: 'Active',
  });
  if (rollConflict) {
    throw ApiError.conflict(`Roll number ${rollNumber} is already assigned in this section.`);
  }

  // 3. Resolve Parent Profile (Link existing or Create new)
  let resolvedParentId = parentId;

  if (!resolvedParentId && parentData) {
    // Generate unique parentId
    const parentCount = await Parent.countDocuments();
    const generatedParentId = `PAR-${new Date().getFullYear()}-${String(parentCount + 1).padStart(4, '0')}`;

    const newParent = await Parent.create({
      parentId: generatedParentId,
      fatherName: parentData.fatherName || '',
      fatherPhone: parentData.fatherPhone || '',
      fatherEmail: parentData.fatherEmail || '',
      fatherOccupation: parentData.fatherOccupation || '',
      motherName: parentData.motherName || '',
      motherPhone: parentData.motherPhone || '',
      primaryContactNumber: parentData.primaryContactNumber || parentData.fatherPhone || parentData.motherPhone,
      address: address || {},
    });
    resolvedParentId = newParent._id;
  }

  if (!resolvedParentId) {
    throw ApiError.badRequest('Parent information or parent ID reference is required to enroll a student.');
  }

  // 4. Create Student Document
  const student = await Student.create({
    studentId: finalStudentId,
    admissionNumber: finalAdmissionNo,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bloodGroup: bloodGroup || 'Unknown',
    classId,
    sectionId,
    rollNumber,
    academicSessionId: targetSessionId,
    photo: photo || null,
    contact: contact || {},
    address: address || {},
    parentId: resolvedParentId,
    previousSchool: previousSchool || {},
    emergencyContact: emergencyContact || {
      name: parentData?.fatherName || 'Parent',
      relationship: 'Father',
      phone: contact?.phone || '0000000000',
    },
    status: 'Active',
  });

  // 5. Connect student to parent's studentIds array
  await Parent.findByIdAndUpdate(resolvedParentId, {
    $addToSet: { studentIds: student._id },
  });

  const populated = await Student.findById(student._id)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('parentId');

  return ApiResponse.created(res, populated, 'Central student profile created successfully');
});

// ==================== UPDATE STUDENT ====================
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id);
  if (!student) throw ApiError.notFound('Student not found');

  // If changing roll number or class/section, check conflict
  if (
    (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) ||
    (req.body.sectionId && req.body.sectionId.toString() !== student.sectionId.toString())
  ) {
    const rollConflict = await Student.findOne({
      _id: { $ne: id },
      classId: req.body.classId || student.classId,
      sectionId: req.body.sectionId || student.sectionId,
      rollNumber: req.body.rollNumber || student.rollNumber,
      academicSessionId: student.academicSessionId,
      status: 'Active',
    });
    if (rollConflict) {
      throw ApiError.conflict(`Roll number is already assigned in this section.`);
    }
  }

  const updated = await Student.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('parentId');

  return ApiResponse.ok(res, updated, 'Student updated successfully');
});

// ==================== UPDATE STUDENT STATUS ====================
export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Inactive', 'Transferred', 'Graduated', 'Withdrawn'].includes(status)) {
    throw ApiError.badRequest('Invalid student status transition');
  }

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!student) throw ApiError.notFound('Student not found');

  return ApiResponse.ok(res, student, `Student status changed to ${status}`);
});

// ==================== EXPORT STUDENTS ====================
export const exportStudents = asyncHandler(async (req, res) => {
  const { classId, sectionId, status = 'Active' } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (status !== 'All') filter.status = status;

  const students = await Student.find(filter)
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('parentId', 'fatherName motherName primaryContactNumber')
    .sort({ rollNumber: 1 });

  const exportData = students.map((s) => ({
    studentId: s.studentId,
    admissionNumber: s.admissionNumber,
    name: `${s.firstName} ${s.lastName}`,
    class: s.classId?.name || '',
    section: s.sectionId?.name || '',
    rollNumber: s.rollNumber,
    gender: s.gender,
    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.toISOString().split('T')[0] : '',
    phone: s.contact?.phone || s.parentId?.primaryContactNumber || '',
    fatherName: s.parentId?.fatherName || '',
    status: s.status,
  }));

  return ApiResponse.ok(res, exportData, 'Export dataset generated');
});
