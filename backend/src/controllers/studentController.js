import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import AcademicSession from '../models/AcademicSession.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Document from '../models/Document.js';
import { logAudit } from '../utils/auditLogger.js';
import { provisionStudentAndParentAccounts } from '../utils/accountProvisioner.js';

const getNextSequenceNumber = async (Model, field, prefix) => {
  const regex = new RegExp(`^${prefix}`);
  const records = await Model.find({ [field]: regex })
    .select(field)
    .lean();

  let maxSeq = 0;
  for (const r of records) {
    const val = r[field];
    if (val) {
      const parts = val.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  while (await Model.exists({ [field]: `${prefix}${String(nextSeq).padStart(4, '0')}` })) {
    nextSeq++;
  }
  return nextSeq;
};

// ==================== GET STUDENTS (SEARCH, FILTER, PAGINATE) ====================
export const getStudents = asyncHandler(async (req, res) => {
  // CRITICAL SECURITY GUARD: Students cannot view the school-wide student directory
  if (req.user?.role?.name === 'STUDENT') {
    throw ApiError.forbidden(
      'Students are not authorized to view the school student directory. Please access your records via the Student Portal.'
    );
  }

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
  // CRITICAL SECURITY GUARD: Students can ONLY view their own profile
  if (req.user?.role?.name === 'STUDENT') {
    if (req.user.studentId && req.user.studentId.toString() !== req.params.id) {
      throw ApiError.forbidden('Access denied. You are only authorized to access your own student profile.');
    }
  }

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

  // Provision / retrieve login credentials for student and parent
  const credentials = await provisionStudentAndParentAccounts({
    student,
    parent: student.parentId,
    studentEmail: student.contact?.email,
    parentEmail: student.parentId?.fatherEmail || student.parentId?.email,
  });

  return ApiResponse.ok(
    res,
    {
      student,
      documents,
      credentials,
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
  const currentYear = new Date().getFullYear();
  if (!finalStudentId) {
    const nextSeq = await getNextSequenceNumber(Student, 'studentId', `STU-${currentYear}-`);
    finalStudentId = `STU-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  }

  let finalAdmissionNo = admissionNumber;
  if (!finalAdmissionNo) {
    const nextSeq = await getNextSequenceNumber(Student, 'admissionNumber', `ADM-${currentYear}-`);
    finalAdmissionNo = `ADM-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
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
    const nextParentSeq = await getNextSequenceNumber(Parent, 'parentId', `PAR-${currentYear}-`);
    const generatedParentId = `PAR-${currentYear}-${String(nextParentSeq).padStart(4, '0')}`;

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

  const parentDoc = await Parent.findById(resolvedParentId);

  // 6. Automatically provision login accounts for Student and Father
  const credentials = await provisionStudentAndParentAccounts({
    student,
    parent: parentDoc,
    studentEmail: contact?.email,
    parentEmail: parentData?.fatherEmail || parentDoc?.fatherEmail || parentDoc?.email,
  });

  const populated = await Student.findById(student._id)
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('parentId');

  req._auditLogged = true;
  await logAudit({
    req,
    action: 'STUDENT_ENROLLED',
    resource: 'Student',
    resourceId: student._id,
    description: `Enrolled new student: ${student.firstName} ${student.lastName} (${student.studentId}, Roll #${student.rollNumber}). Generated student login (${credentials.studentCredentials?.username}) & father login (${credentials.parentCredentials?.username}).`,
    details: {
      studentId: student.studentId,
      fullName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      admissionNumber: student.admissionNumber,
      studentUsername: credentials.studentCredentials?.username,
      parentUsername: credentials.parentCredentials?.username,
    },
    diff: { before: null, after: populated },
    status: 'SUCCESS',
  });

  return ApiResponse.created(
    res,
    {
      student: populated,
      credentials,
    },
    'Central student profile and login credentials created successfully'
  );
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

  req._auditLogged = true;
  await logAudit({
    req,
    action: 'STUDENT_UPDATED',
    resource: 'Student',
    resourceId: id,
    description: `Updated record for student: ${student.firstName} ${student.lastName} (${student.studentId})`,
    details: { studentId: student.studentId },
    status: 'SUCCESS',
  });

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

  req._auditLogged = true;
  await logAudit({
    req,
    action: 'STUDENT_STATUS_CHANGED',
    resource: 'Student',
    resourceId: student._id,
    description: `Changed status of student ${student.firstName} ${student.lastName} (${student.studentId}) to ${status}`,
    details: { studentId: student.studentId, newStatus: status },
    status: 'SUCCESS',
  });

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

// ==================== BULK IMPORT STUDENTS ====================
export const bulkImportStudents = asyncHandler(async (req, res) => {
  const {
    students = [],
    academicSessionId,
    defaultClassId,
    defaultSectionId,
    autoAssignRollNumber = true,
  } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest('No student records provided for import.');
  }

  // 1. Resolve Academic Session
  let targetSessionId = academicSessionId;
  if (!targetSessionId) {
    const currentSession = await AcademicSession.findOne({ isCurrent: true });
    if (currentSession) {
      targetSessionId = currentSession._id;
    } else {
      const anySession = await AcademicSession.findOne().sort({ createdAt: -1 });
      if (!anySession) {
        throw ApiError.badRequest('No academic session found in the system. Please create an academic session first.');
      }
      targetSessionId = anySession._id;
    }
  }

  // 2. Preload Classes & Sections for intelligent lookup
  const allClasses = await SchoolClass.find().lean();
  const allSections = await Section.find().lean();

  const classMap = new Map();
  allClasses.forEach((c) => {
    classMap.set(c._id.toString(), c);
    classMap.set(c.name.trim().toLowerCase(), c);
    if (c.code) classMap.set(c.code.trim().toLowerCase(), c);
  });

  const sectionMap = new Map();
  allSections.forEach((s) => {
    sectionMap.set(s._id.toString(), s);
    const key = `${s.classId.toString()}_${s.name.trim().toUpperCase()}`;
    sectionMap.set(key, s);
  });

  // Track assigned roll numbers per class/section in this academic session
  const rollMap = new Map();
  const getSectionRolls = async (clsId, secId) => {
    const key = `${clsId}_${secId}`;
    if (!rollMap.has(key)) {
      const existing = await Student.find({
        classId: clsId,
        sectionId: secId,
        academicSessionId: targetSessionId,
        status: 'Active',
      }).select('rollNumber').lean();
      const set = new Set(existing.map((s) => Number(s.rollNumber)).filter(Boolean));
      rollMap.set(key, set);
    }
    return rollMap.get(key);
  };

  // 3. Prepare sequence counters for current year
  const currentYear = new Date().getFullYear();
  const studentPrefix = `STU-${currentYear}-`;
  const admissionPrefix = `ADM-${currentYear}-`;
  const parentPrefix = `PAR-${currentYear}-`;

  let currentStudentSeq = await getNextSequenceNumber(Student, 'studentId', studentPrefix);
  let currentAdmissionSeq = await getNextSequenceNumber(Student, 'admissionNumber', admissionPrefix);
  let currentParentSeq = await getNextSequenceNumber(Parent, 'parentId', parentPrefix);

  const results = {
    total: students.length,
    importedCount: 0,
    failedCount: 0,
    imported: [],
    errors: [],
  };

  const parentByPhone = new Map();

  for (let index = 0; index < students.length; index++) {
    const row = students[index];
    const rowNum = index + 1;

    try {
      // Clean and extract fields
      let firstName = (row.firstName || row.firstname || row.first_name || '').trim();
      let lastName = (row.lastName || row.lastname || row.last_name || '').trim();

      if (!firstName && (row.name || row.studentName || row.fullName)) {
        const rawName = String(row.name || row.studentName || row.fullName).trim();
        const parts = rawName.split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          firstName = parts[0];
        }
      }

      if (!firstName) {
        throw new Error('Student first name is required.');
      }
      if (!lastName) {
        lastName = '-';
      }

      // Resolve Class
      let resolvedClass = null;
      if (row.classId && classMap.has(row.classId.toString())) {
        resolvedClass = classMap.get(row.classId.toString());
      } else if (row.class || row.className) {
        const cKey = String(row.class || row.className).trim().toLowerCase();
        resolvedClass = classMap.get(cKey);
      }
      if (!resolvedClass && defaultClassId && classMap.has(defaultClassId.toString())) {
        resolvedClass = classMap.get(defaultClassId.toString());
      }
      if (!resolvedClass) {
        throw new Error('Valid Class assignment could not be resolved. Please specify Class.');
      }

      // Resolve Section
      let resolvedSection = null;
      if (row.sectionId && sectionMap.has(row.sectionId.toString())) {
        resolvedSection = sectionMap.get(row.sectionId.toString());
      } else if (row.section || row.sectionName) {
        const secInput = String(row.section || row.sectionName).trim().replace(/^section\s+/i, '').toUpperCase();
        const sKey = `${resolvedClass._id.toString()}_${secInput}`;
        resolvedSection = sectionMap.get(sKey);
      }
      if (!resolvedSection && defaultSectionId && sectionMap.has(defaultSectionId.toString())) {
        resolvedSection = sectionMap.get(defaultSectionId.toString());
      }
      if (!resolvedSection) {
        // Fallback: default to the first section available in this class
        const firstSec = allSections.find((s) => s.classId.toString() === resolvedClass._id.toString());
        if (firstSec) {
          resolvedSection = firstSec;
        } else {
          throw new Error(`No section exists for class ${resolvedClass.name}. Please configure sections first.`);
        }
      }

      // Resolve Roll Number
      const sectionRolls = await getSectionRolls(resolvedClass._id.toString(), resolvedSection._id.toString());
      let rollNo = parseInt(row.rollNumber || row.rollnumber || row.roll_number || row.roll, 10);

      if (!isNaN(rollNo) && rollNo > 0) {
        if (sectionRolls.has(rollNo)) {
          if (autoAssignRollNumber) {
            let nextR = 1;
            while (sectionRolls.has(nextR)) nextR++;
            rollNo = nextR;
          } else {
            throw new Error(`Roll number ${rollNo} is already assigned in ${resolvedClass.name} Section ${resolvedSection.name}.`);
          }
        }
      } else {
        let nextR = 1;
        while (sectionRolls.has(nextR)) nextR++;
        rollNo = nextR;
      }
      sectionRolls.add(rollNo);

      // Gender
      let gender = 'Male';
      const rawGender = String(row.gender || '').trim().toLowerCase();
      if (['f', 'female', 'girl'].includes(rawGender)) gender = 'Female';
      else if (['o', 'other'].includes(rawGender)) gender = 'Other';

      // Date of Birth
      let dob = row.dateOfBirth || row.dob || row.date_of_birth;
      let parsedDob = new Date('2012-01-01');
      if (dob) {
        const testD = new Date(dob);
        if (!isNaN(testD.getTime())) parsedDob = testD;
      }

      // Blood Group
      const rawBlood = String(row.bloodGroup || row.blood_group || 'Unknown').trim().toUpperCase();
      const validBloods = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const bloodGroup = validBloods.includes(rawBlood) ? rawBlood : 'Unknown';

      // Contact info
      const phone = String(row.phone || row.contact || row.mobileNumber || row.mobile || '').trim();
      const email = String(row.email || '').trim().toLowerCase();

      // Parent details
      const fatherName = (row.fatherName || row.fathername || row.father || row.parentName || row.guardianName || `Parent of ${firstName}`).trim();
      const fatherPhone = (row.fatherPhone || row.parentPhone || phone || '9876543210').trim();
      const motherName = (row.motherName || row.mothername || row.mother || '').trim();
      const motherPhone = (row.motherPhone || '').trim();

      // Resolve or create Parent profile
      let resolvedParentId = null;
      if (fatherPhone && fatherPhone !== '9876543210') {
        if (parentByPhone.has(fatherPhone)) {
          resolvedParentId = parentByPhone.get(fatherPhone);
        } else {
          const existingParent = await Parent.findOne({
            $or: [{ primaryContactNumber: fatherPhone }, { fatherPhone: fatherPhone }],
          });
          if (existingParent) {
            resolvedParentId = existingParent._id;
            parentByPhone.set(fatherPhone, resolvedParentId);
          }
        }
      }

      if (!resolvedParentId) {
        const newParentIdStr = `${parentPrefix}${String(currentParentSeq++).padStart(4, '0')}`;
        const newParent = await Parent.create({
          parentId: newParentIdStr,
          fatherName: fatherName,
          fatherPhone: fatherPhone,
          motherName: motherName,
          motherPhone: motherPhone,
          primaryContactNumber: fatherPhone,
          address: {
            street: (row.address || row.street || '').trim(),
            city: (row.city || '').trim(),
          },
        });
        resolvedParentId = newParent._id;
        if (fatherPhone && fatherPhone !== '9876543210') {
          parentByPhone.set(fatherPhone, resolvedParentId);
        }
      }

      // Generate unique studentId & admissionNumber
      let studentIdStr = `${studentPrefix}${String(currentStudentSeq++).padStart(4, '0')}`;
      while (await Student.exists({ studentId: studentIdStr })) {
        studentIdStr = `${studentPrefix}${String(currentStudentSeq++).padStart(4, '0')}`;
      }

      let admissionNoStr = `${admissionPrefix}${String(currentAdmissionSeq++).padStart(4, '0')}`;
      while (await Student.exists({ admissionNumber: admissionNoStr })) {
        admissionNoStr = `${admissionPrefix}${String(currentAdmissionSeq++).padStart(4, '0')}`;
      }

      // Create Student
      const student = await Student.create({
        studentId: studentIdStr,
        admissionNumber: admissionNoStr,
        firstName,
        lastName,
        dateOfBirth: parsedDob,
        gender,
        bloodGroup,
        classId: resolvedClass._id,
        sectionId: resolvedSection._id,
        rollNumber: rollNo,
        academicSessionId: targetSessionId,
        contact: { phone, email },
        address: {
          street: (row.address || row.street || '').trim(),
          city: (row.city || '').trim(),
        },
        parentId: resolvedParentId,
        emergencyContact: {
          name: fatherName || `${firstName}'s Guardian`,
          relationship: 'Father',
          phone: fatherPhone,
        },
        status: 'Active',
      });

      // Link to parent
      await Parent.findByIdAndUpdate(resolvedParentId, {
        $addToSet: { studentIds: student._id },
      });

      const parentDoc = await Parent.findById(resolvedParentId);

      // Auto-provision login accounts for both Student and Father
      const credentials = await provisionStudentAndParentAccounts({
        student,
        parent: parentDoc,
        studentEmail: email,
        parentEmail: row.fatherEmail || row.parentEmail || parentDoc?.fatherEmail || parentDoc?.email,
      });

      results.importedCount++;
      results.imported.push({
        row: rowNum,
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        name: `${student.firstName} ${student.lastName}`,
        class: resolvedClass.name,
        section: resolvedSection.name,
        rollNumber: student.rollNumber,
        studentUsername: credentials.studentCredentials?.username,
        studentPassword: credentials.studentCredentials?.password,
        fatherName: parentDoc?.fatherName || fatherName,
        fatherUsername: credentials.parentCredentials?.username,
        fatherPassword: credentials.parentCredentials?.password,
        isExistingParentAccount: !credentials.parentCredentials?.isNew,
      });
    } catch (err) {
      results.failedCount++;
      results.errors.push({
        row: rowNum,
        name: (row.firstName || row.name || `Row ${rowNum}`).trim(),
        reason: err.message || 'Validation or insertion error',
      });
    }
  }

  req._auditLogged = true;
  await logAudit({
    req,
    action: 'BULK_STUDENTS_IMPORTED',
    resource: 'Student',
    description: `Bulk imported students: ${results.importedCount} succeeded, ${results.failedCount} failed.`,
    details: {
      total: results.total,
      importedCount: results.importedCount,
      failedCount: results.failedCount,
    },
    status: results.importedCount > 0 ? 'SUCCESS' : 'FAILURE',
  });

  return ApiResponse.ok(
    res,
    results,
    `Bulk import completed: ${results.importedCount} of ${results.total} students imported successfully.`
  );
});
