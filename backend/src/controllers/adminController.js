import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import AcademicSession from '../models/AcademicSession.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import Notice from '../models/Notice.js';
import Student from '../models/Student.js';
import Employee from '../models/Employee.js';

// ==================== ACADEMIC SESSIONS ====================
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await AcademicSession.find().sort({ startDate: -1 });
  return ApiResponse.ok(res, sessions, 'Academic sessions retrieved successfully');
});

export const createSession = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isCurrent } = req.body;
  const existing = await AcademicSession.findOne({ name });
  if (existing) throw ApiError.conflict(`Session '${name}' already exists.`);

  const session = await AcademicSession.create({
    name,
    startDate,
    endDate,
    isCurrent: !!isCurrent,
  });

  return ApiResponse.created(res, session, 'Academic session created successfully');
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await AcademicSession.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!session) throw ApiError.notFound('Academic session not found');
  return ApiResponse.ok(res, session, 'Academic session updated successfully');
});

// ==================== TEACHERS / FACULTY ====================
export const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Employee.find({ status: 'Active' })
    .select('_id firstName lastName employeeId email phone designationId departmentId')
    .sort({ firstName: 1 });
  return ApiResponse.ok(res, teachers, 'Active faculty retrieved successfully');
});

// ==================== CLASSES ====================
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await SchoolClass.find()
    .populate('classTeacherId', 'firstName lastName employeeId email phone')
    .sort({ numericOrder: 1 });
  return ApiResponse.ok(res, classes, 'Classes retrieved successfully');
});

export const getComprehensiveClassDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolClass = await SchoolClass.findById(id)
    .populate('classTeacherId', 'firstName lastName employeeId email phone');
  if (!schoolClass) throw ApiError.notFound('Class not found');

  const [sections, subjects, totalStudents] = await Promise.all([
    Section.find({ classId: id })
      .populate('classTeacherId', 'firstName lastName employeeId email phone')
      .sort({ name: 1 }),
    Subject.find({ classId: id })
      .populate('assignedTeacherIds', 'firstName lastName employeeId email phone')
      .sort({ name: 1 }),
    Student.countDocuments({ currentClass: id, status: 'Active' }),
  ]);

  return ApiResponse.ok(
    res,
    {
      schoolClass,
      sections,
      subjects,
      books: schoolClass.books || [],
      totalStudents,
    },
    'Comprehensive class details retrieved successfully'
  );
});

export const createClass = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    numericOrder,
    description,
    floorNumber,
    building,
    roomNumber,
    classTeacherId,
    books,
    sections,
    subjects,
  } = req.body;

  const existing = await SchoolClass.findOne({
    $or: [{ name: name?.trim() }, { code: code?.trim().toUpperCase() }],
  });
  if (existing) throw ApiError.conflict('Class with this name or code already exists.');

  const newClass = await SchoolClass.create({
    name: name?.trim(),
    code: code?.trim().toUpperCase(),
    numericOrder,
    description,
    floorNumber: floorNumber || '',
    building: building || '',
    roomNumber: roomNumber || '',
    classTeacherId: classTeacherId || null,
    books: Array.isArray(books) ? books : [],
  });

  // If sections provided during class creation, create them
  if (Array.isArray(sections) && sections.length > 0) {
    for (const sec of sections) {
      if (sec.name) {
        await Section.create({
          name: sec.name.trim().toUpperCase(),
          classId: newClass._id,
          capacity: sec.capacity || 40,
          classTeacherId: sec.classTeacherId || null,
          roomNumber: sec.roomNumber || '',
        });
      }
    }
  }

  // If subjects provided during class creation, create them
  if (Array.isArray(subjects) && subjects.length > 0) {
    for (const sub of subjects) {
      if (sub.name && sub.code) {
        await Subject.create({
          name: sub.name.trim(),
          code: sub.code.trim().toUpperCase(),
          type: sub.type || 'Core',
          classId: newClass._id,
          totalMarks: sub.totalMarks || 100,
          passMarks: sub.passMarks || 40,
          assignedTeacherIds: Array.isArray(sub.assignedTeacherIds)
            ? sub.assignedTeacherIds
            : sub.assignedTeacherId
            ? [sub.assignedTeacherId]
            : [],
        });
      }
    }
  }

  const populatedClass = await SchoolClass.findById(newClass._id)
    .populate('classTeacherId', 'firstName lastName employeeId email phone');

  return ApiResponse.created(res, populatedClass, 'Class created successfully');
});

export const updateClass = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    numericOrder,
    description,
    floorNumber,
    building,
    roomNumber,
    classTeacherId,
    books,
    sections,
    subjects,
    deletedSectionIds,
    deletedSubjectIds,
    isActive,
  } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (code !== undefined) updateData.code = code.trim().toUpperCase();
  if (numericOrder !== undefined) updateData.numericOrder = numericOrder;
  if (description !== undefined) updateData.description = description;
  if (floorNumber !== undefined) updateData.floorNumber = floorNumber;
  if (building !== undefined) updateData.building = building;
  if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
  if (classTeacherId !== undefined) updateData.classTeacherId = classTeacherId || null;
  if (books !== undefined && Array.isArray(books)) updateData.books = books;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await SchoolClass.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('classTeacherId', 'firstName lastName employeeId email phone');

  if (!updated) throw ApiError.notFound('Class not found');

  // If sections provided, create or update them
  if (Array.isArray(sections)) {
    for (const sec of sections) {
      if (!sec.name) continue;
      if (sec._id) {
        await Section.findByIdAndUpdate(sec._id, {
          name: sec.name.trim().toUpperCase(),
          capacity: sec.capacity || 40,
          classTeacherId: sec.classTeacherId || null,
          roomNumber: sec.roomNumber || '',
        });
      } else {
        await Section.create({
          name: sec.name.trim().toUpperCase(),
          classId: updated._id,
          capacity: sec.capacity || 40,
          classTeacherId: sec.classTeacherId || null,
          roomNumber: sec.roomNumber || '',
        });
      }
    }
  }

  // Handle explicitly removed sections (if safe)
  if (Array.isArray(deletedSectionIds) && deletedSectionIds.length > 0) {
    for (const sId of deletedSectionIds) {
      const studentCount = await Student.countDocuments({ currentSection: sId });
      if (studentCount === 0) {
        await Section.findByIdAndDelete(sId);
      }
    }
  }

  // If subjects provided, create or update them
  if (Array.isArray(subjects)) {
    for (const sub of subjects) {
      if (!sub.name || !sub.code) continue;
      const teacherIds = Array.isArray(sub.assignedTeacherIds)
        ? sub.assignedTeacherIds
        : sub.assignedTeacherId
        ? [sub.assignedTeacherId]
        : [];

      if (sub._id) {
        await Subject.findByIdAndUpdate(sub._id, {
          name: sub.name.trim(),
          code: sub.code.trim().toUpperCase(),
          type: sub.type || 'Core',
          totalMarks: sub.totalMarks || 100,
          passMarks: sub.passMarks || 40,
          assignedTeacherIds: teacherIds,
        });
      } else {
        await Subject.create({
          name: sub.name.trim(),
          code: sub.code.trim().toUpperCase(),
          type: sub.type || 'Core',
          classId: updated._id,
          totalMarks: sub.totalMarks || 100,
          passMarks: sub.passMarks || 40,
          assignedTeacherIds: teacherIds,
        });
      }
    }
  }

  // Handle explicitly removed subjects
  if (Array.isArray(deletedSubjectIds) && deletedSubjectIds.length > 0) {
    await Subject.deleteMany({ _id: { $in: deletedSubjectIds }, classId: updated._id });
  }

  return ApiResponse.ok(res, updated, 'Class updated successfully');
});

export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentCount = await Student.countDocuments({ currentClass: id });
  if (studentCount > 0) {
    throw ApiError.badRequest(`Cannot delete class. ${studentCount} active student(s) are enrolled in this class.`);
  }

  await Section.deleteMany({ classId: id });
  await Subject.deleteMany({ classId: id });
  const deleted = await SchoolClass.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound('Class not found');

  return ApiResponse.ok(res, null, 'Class and associated records deleted successfully');
});

// ==================== SECTIONS ====================
export const getSections = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = classId ? { classId } : {};
  const sections = await Section.find(filter)
    .populate('classId', 'name code')
    .populate('classTeacherId', 'firstName lastName employeeId email phone')
    .sort({ name: 1 });

  return ApiResponse.ok(res, sections, 'Sections retrieved successfully');
});

export const createSection = asyncHandler(async (req, res) => {
  const { name, classId, capacity, classTeacherId, roomNumber } = req.body;
  const existing = await Section.findOne({ name: name.toUpperCase(), classId });
  if (existing) throw ApiError.conflict(`Section '${name}' already exists in this class.`);

  const section = await Section.create({
    name: name.toUpperCase(),
    classId,
    capacity: capacity || 40,
    classTeacherId: classTeacherId || null,
    roomNumber,
  });

  return ApiResponse.created(res, section, 'Section created successfully');
});

export const updateSection = asyncHandler(async (req, res) => {
  const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('classId', 'name code')
    .populate('classTeacherId', 'firstName lastName employeeId email phone');

  if (!section) throw ApiError.notFound('Section not found');
  return ApiResponse.ok(res, section, 'Section updated successfully');
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentCount = await Student.countDocuments({ currentSection: id });
  if (studentCount > 0) {
    throw ApiError.badRequest(`Cannot delete section. ${studentCount} active student(s) are currently enrolled in it.`);
  }

  const deleted = await Section.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound('Section not found');
  return ApiResponse.ok(res, null, 'Section deleted successfully');
});

// ==================== SUBJECTS ====================
export const getSubjects = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = classId ? { classId } : {};
  const subjects = await Subject.find(filter)
    .populate('classId', 'name code')
    .populate('assignedTeacherIds', 'firstName lastName employeeId email phone')
    .sort({ name: 1 });

  return ApiResponse.ok(res, subjects, 'Subjects retrieved successfully');
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, type, classId, totalMarks, passMarks, assignedTeacherIds, assignedTeacherId } = req.body;
  const existing = await Subject.findOne({ code: code.toUpperCase(), classId });
  if (existing) throw ApiError.conflict(`Subject code '${code}' already exists for this class.`);

  const teacherIds = Array.isArray(assignedTeacherIds)
    ? assignedTeacherIds
    : assignedTeacherId
    ? [assignedTeacherId]
    : [];

  const subject = await Subject.create({
    name,
    code: code.toUpperCase(),
    type: type || 'Core',
    classId,
    totalMarks: totalMarks || 100,
    passMarks: passMarks || 40,
    assignedTeacherIds: teacherIds,
  });

  return ApiResponse.created(res, subject, 'Subject created successfully');
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { name, code, type, classId, totalMarks, passMarks, assignedTeacherIds, assignedTeacherId } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (code !== undefined) updateData.code = code.toUpperCase();
  if (type !== undefined) updateData.type = type;
  if (classId !== undefined) updateData.classId = classId;
  if (totalMarks !== undefined) updateData.totalMarks = totalMarks;
  if (passMarks !== undefined) updateData.passMarks = passMarks;

  if (assignedTeacherIds !== undefined) {
    updateData.assignedTeacherIds = Array.isArray(assignedTeacherIds) ? assignedTeacherIds : [];
  } else if (assignedTeacherId !== undefined) {
    updateData.assignedTeacherIds = assignedTeacherId ? [assignedTeacherId] : [];
  }

  const subject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('assignedTeacherIds', 'firstName lastName employeeId');

  if (!subject) throw ApiError.notFound('Subject not found');
  return ApiResponse.ok(res, subject, 'Subject updated successfully');
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await Subject.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound('Subject not found');
  return ApiResponse.ok(res, null, 'Subject deleted successfully');
});

// ==================== DEPARTMENTS & DESIGNATIONS ====================
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate('headOfDepartment', 'firstName lastName employeeId')
    .sort({ name: 1 });
  return ApiResponse.ok(res, departments, 'Departments retrieved successfully');
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, headOfDepartment } = req.body;
  const existing = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (existing) throw ApiError.conflict('Department with this name or code already exists.');

  const dept = await Department.create({
    name,
    code: code.toUpperCase(),
    description,
    headOfDepartment: headOfDepartment || null,
  });

  return ApiResponse.created(res, dept, 'Department created successfully');
});

export const getDesignations = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const filter = departmentId ? { departmentId } : {};
  const designations = await Designation.find(filter)
    .populate('departmentId', 'name code')
    .sort({ title: 1 });
  return ApiResponse.ok(res, designations, 'Designations retrieved successfully');
});

export const createDesignation = asyncHandler(async (req, res) => {
  const { title, code, departmentId, description } = req.body;
  const existing = await Designation.findOne({ title, departmentId });
  if (existing) throw ApiError.conflict('Designation already exists in this department.');

  const desig = await Designation.create({
    title,
    code: code.toUpperCase(),
    departmentId,
    description,
  });

  return ApiResponse.created(res, desig, 'Designation created successfully');
});

// ==================== NOTICES & CIRCULARS ====================
export const getNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find()
    .populate('authorId', 'username')
    .populate('targetClasses', 'name code')
    .sort({ isPinned: -1, publishDate: -1 });

  return ApiResponse.ok(res, notices, 'Notices retrieved successfully');
});

export const createNotice = asyncHandler(async (req, res) => {
  const { title, content, category, targetAudience, targetClasses, isPinned, attachmentUrl } = req.body;

  const notice = await Notice.create({
    title,
    content,
    category: category || 'General',
    targetAudience: targetAudience || ['All'],
    targetClasses: targetClasses || [],
    isPinned: !!isPinned,
    attachmentUrl: attachmentUrl || null,
    authorId: req.user._id,
  });

  return ApiResponse.created(res, notice, 'Notice published successfully');
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) throw ApiError.notFound('Notice not found');
  return ApiResponse.ok(res, null, 'Notice deleted successfully');
});

// ==================== SYSTEM SUMMARY STATS ====================
export const getSystemStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalStaff, totalClasses, totalSections, currentSession] = await Promise.all([
    Student.countDocuments({ status: 'Active' }),
    Employee.countDocuments({ status: 'Active' }),
    SchoolClass.countDocuments({ isActive: true }),
    Section.countDocuments({ isActive: true }),
    AcademicSession.findOne({ isCurrent: true }),
  ]);

  return ApiResponse.ok(
    res,
    {
      totalStudents,
      totalStaff,
      totalClasses,
      totalSections,
      currentSession: currentSession ? currentSession.name : 'Not Configured',
    },
    'System statistics retrieved'
  );
});
