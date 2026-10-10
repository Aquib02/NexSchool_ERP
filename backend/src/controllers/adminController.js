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

// ==================== CLASSES ====================
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await SchoolClass.find().sort({ numericOrder: 1 });
  return ApiResponse.ok(res, classes, 'Classes retrieved successfully');
});

export const createClass = asyncHandler(async (req, res) => {
  const { name, code, numericOrder, description } = req.body;
  const existing = await SchoolClass.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (existing) throw ApiError.conflict('Class with this name or code already exists.');

  const newClass = await SchoolClass.create({
    name,
    code: code.toUpperCase(),
    numericOrder,
    description,
  });

  return ApiResponse.created(res, newClass, 'Class created successfully');
});

export const updateClass = asyncHandler(async (req, res) => {
  const updated = await SchoolClass.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw ApiError.notFound('Class not found');
  return ApiResponse.ok(res, updated, 'Class updated successfully');
});

// ==================== SECTIONS ====================
export const getSections = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = classId ? { classId } : {};
  const sections = await Section.find(filter)
    .populate('classId', 'name code')
    .populate('classTeacherId', 'firstName lastName employeeId email')
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
  }).populate('classId', 'name code').populate('classTeacherId', 'firstName lastName');

  if (!section) throw ApiError.notFound('Section not found');
  return ApiResponse.ok(res, section, 'Section updated successfully');
});

// ==================== SUBJECTS ====================
export const getSubjects = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const filter = classId ? { classId } : {};
  const subjects = await Subject.find(filter)
    .populate('classId', 'name code')
    .populate('assignedTeacherIds', 'firstName lastName employeeId')
    .sort({ name: 1 });

  return ApiResponse.ok(res, subjects, 'Subjects retrieved successfully');
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, type, classId, totalMarks, passMarks, assignedTeacherIds } = req.body;
  const existing = await Subject.findOne({ code: code.toUpperCase(), classId });
  if (existing) throw ApiError.conflict(`Subject code '${code}' already exists for this class.`);

  const subject = await Subject.create({
    name,
    code: code.toUpperCase(),
    type: type || 'Core',
    classId,
    totalMarks: totalMarks || 100,
    passMarks: passMarks || 40,
    assignedTeacherIds: assignedTeacherIds || [],
  });

  return ApiResponse.created(res, subject, 'Subject created successfully');
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!subject) throw ApiError.notFound('Subject not found');
  return ApiResponse.ok(res, subject, 'Subject updated successfully');
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
