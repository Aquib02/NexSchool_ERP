import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  Student,
  Employee,
  AdmissionApplication,
  Book,
  StudentFee,
  ITTicket,
  Asset,
} from '../models/index.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const globalSearch = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  const rawQuery = q.trim();

  if (!rawQuery) {
    return ApiResponse.ok(
      res,
      {
        students: [],
        staff: [],
        admissions: [],
        books: [],
        invoices: [],
        itTickets: [],
        assets: [],
      },
      'Empty query'
    );
  }

  const regex = new RegExp(escapeRegex(rawQuery), 'i');

  const [
    studentsRes,
    staffRes,
    admissionsRes,
    booksRes,
    invoicesRes,
    itTicketsRes,
    assetsRes,
  ] = await Promise.allSettled([
    Student.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { studentId: regex },
        { admissionNumber: regex },
        { 'contact.phone': regex },
      ],
    })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .select('firstName lastName studentId admissionNumber rollNumber classId sectionId status')
      .limit(6)
      .lean(),

    Employee.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { employeeId: regex },
        { email: regex },
        { phone: regex },
      ],
    })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .select('firstName lastName employeeId email phone departmentId designationId status')
      .limit(6)
      .lean(),

    AdmissionApplication.find({
      $or: [
        { candidateName: regex },
        { applicationNumber: regex },
        { phone: regex },
        { email: regex },
      ],
    })
      .select('candidateName applicationNumber status phone gradeAppliedFor')
      .limit(6)
      .lean(),

    Book.find({
      $or: [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { accessionNumber: regex },
      ],
    })
      .select('title author isbn accessionNumber availableCopies category')
      .limit(6)
      .lean(),

    StudentFee.find({
      $or: [{ invoiceNumber: regex }],
    })
      .populate('studentId', 'firstName lastName studentId')
      .select('invoiceNumber totalAmount status studentId dueDate')
      .limit(6)
      .lean(),

    ITTicket.find({
      $or: [{ title: regex }, { ticketNumber: regex }],
    })
      .select('ticketNumber title priority status category')
      .limit(6)
      .lean(),

    Asset.find({
      $or: [{ assetName: regex }, { assetTag: regex }, { serialNumber: regex }],
    })
      .select('assetName assetTag category location status')
      .limit(6)
      .lean(),
  ]);

  return ApiResponse.ok(
    res,
    {
      students: studentsRes.status === 'fulfilled' ? studentsRes.value : [],
      staff: staffRes.status === 'fulfilled' ? staffRes.value : [],
      admissions: admissionsRes.status === 'fulfilled' ? admissionsRes.value : [],
      books: booksRes.status === 'fulfilled' ? booksRes.value : [],
      invoices: invoicesRes.status === 'fulfilled' ? invoicesRes.value : [],
      itTickets: itTicketsRes.status === 'fulfilled' ? itTicketsRes.value : [],
      assets: assetsRes.status === 'fulfilled' ? assetsRes.value : [],
    },
    'Global search results'
  );
});
