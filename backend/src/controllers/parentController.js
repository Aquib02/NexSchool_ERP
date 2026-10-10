import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Parent from '../models/Parent.js';
import Student from '../models/Student.js';

export const getParents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query = {};

  if (search.trim()) {
    const reg = new RegExp(search.trim(), 'i');
    query.$or = [
      { fatherName: reg },
      { motherName: reg },
      { guardianName: reg },
      { primaryContactNumber: reg },
      { parentId: reg },
      { fatherEmail: reg },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [total, parents] = await Promise.all([
    Parent.countDocuments(query),
    Parent.find(query)
      .populate({
        path: 'studentIds',
        select: 'firstName lastName studentId admissionNumber rollNumber classId sectionId status',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.ok(
    res,
    {
      parents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    },
    'Parents retrieved successfully'
  );
});

export const getParentById = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id).populate({
    path: 'studentIds',
    select: 'firstName lastName studentId admissionNumber rollNumber classId sectionId status',
    populate: [
      { path: 'classId', select: 'name code' },
      { path: 'sectionId', select: 'name' },
    ],
  });

  if (!parent) throw ApiError.notFound('Parent profile not found');
  return ApiResponse.ok(res, parent, 'Parent details retrieved');
});

export const createParent = asyncHandler(async (req, res) => {
  const {
    fatherName,
    fatherPhone,
    fatherEmail,
    fatherOccupation,
    motherName,
    motherPhone,
    motherEmail,
    primaryContactNumber,
    address,
  } = req.body;

  const count = await Parent.countDocuments();
  const parentId = `PAR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const parent = await Parent.create({
    parentId,
    fatherName,
    fatherPhone,
    fatherEmail,
    fatherOccupation,
    motherName,
    motherPhone,
    motherEmail,
    primaryContactNumber: primaryContactNumber || fatherPhone || motherPhone,
    address: address || {},
    studentIds: [],
  });

  return ApiResponse.created(res, parent, 'Parent profile created successfully');
});

export const updateParent = asyncHandler(async (req, res) => {
  const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!parent) throw ApiError.notFound('Parent profile not found');
  return ApiResponse.ok(res, parent, 'Parent profile updated successfully');
});

export const linkStudentToParent = asyncHandler(async (req, res) => {
  const { parentId, studentId } = req.body;

  const [parent, student] = await Promise.all([
    Parent.findById(parentId),
    Student.findById(studentId),
  ]);

  if (!parent) throw ApiError.notFound('Parent not found');
  if (!student) throw ApiError.notFound('Student not found');

  student.parentId = parent._id;
  await student.save();

  await Parent.findByIdAndUpdate(parentId, {
    $addToSet: { studentIds: student._id },
  });

  return ApiResponse.ok(res, null, 'Student successfully associated with parent profile');
});
