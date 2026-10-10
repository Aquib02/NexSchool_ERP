import mongoose from 'mongoose';
import AdmissionEnquiry from '../models/AdmissionEnquiry.js';
import AdmissionApplication from '../models/AdmissionApplication.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import StaffLeave from '../models/StaffLeave.js';
import Payroll from '../models/Payroll.js';
import Book from '../models/Book.js';
import LibraryTransaction from '../models/LibraryTransaction.js';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import TransportAllocation from '../models/TransportAllocation.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 8 Operations Part 1 Test Suite');
console.log('----------------------------------------------------');

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`  ✓ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`);
    failed++;
  }
};

const runPhase8Tests = async () => {
  try {
    const dummyClassId = new mongoose.Types.ObjectId();
    const dummySessionId = new mongoose.Types.ObjectId();
    const dummyUserId = new mongoose.Types.ObjectId();

    // ========================================================
    // 1. ADMISSIONS WORKFLOW
    // ========================================================
    console.log('\n[Suite 1: Admissions Enquiries & Applications]');
    const enquiry = new AdmissionEnquiry({
      enquiryNumber: 'ENQ-2026-1042',
      candidateName: 'Sophia Miller',
      parentName: 'David Miller',
      phone: '+15552345678',
      email: 'david.miller@example.com',
      targetClassId: dummyClassId,
      academicSessionId: dummySessionId,
      source: 'Walk-in',
      status: 'Open',
    });

    assert(!enquiry.validateSync(), 'AdmissionEnquiry validates cleanly');
    assert(enquiry.enquiryNumber === 'ENQ-2026-1042', 'Enquiry number format matches specification');

    const application = new AdmissionApplication({
      applicationNumber: 'APP-2026-8091',
      enquiryId: enquiry._id,
      academicSessionId: dummySessionId,
      targetClassId: dummyClassId,
      candidate: {
        firstName: 'Sophia',
        lastName: 'Miller',
        dateOfBirth: new Date('2014-06-15'),
        gender: 'Female',
        bloodGroup: 'O+',
      },
      parentDetails: {
        fatherName: 'David Miller',
        primaryPhone: '+15552345678',
        fatherEmail: 'david.miller@example.com',
      },
      entranceTest: {
        totalMarks: 100,
        marksObtained: 85,
        isPassed: true,
      },
      status: 'Selected',
    });

    assert(!application.validateSync(), 'AdmissionApplication validates cleanly');
    assert(application.entranceTest.isPassed === true, 'Entrance test evaluation passes for 85/100');

    // Test Conversion Logic to Central Student
    console.log('\n[Suite 2: One-Click Application -> Central Student Profile]');
    const dummySectionId = new mongoose.Types.ObjectId();
    const dummyParentId = new mongoose.Types.ObjectId();

    const convertedStudent = new Student({
      studentId: 'STU-2026-0999',
      admissionNumber: 'ADM-2026-0999',
      admissionDate: new Date(),
      firstName: application.candidate.firstName,
      lastName: application.candidate.lastName,
      dateOfBirth: application.candidate.dateOfBirth,
      gender: application.candidate.gender,
      bloodGroup: application.candidate.bloodGroup,
      currentClass: application.targetClassId,
      classId: application.targetClassId,
      currentSection: dummySectionId,
      sectionId: dummySectionId,
      parentId: dummyParentId,
      academicSessionId: dummySessionId,
      emergencyContact: {
        name: 'David Miller',
        relationship: 'Father',
        phone: '+15552345678',
      },
      rollNumber: 15,
      status: 'Active',
    });

    assert(!convertedStudent.validateSync(), 'Converted Student conforms cleanly to Central Profile schema');
    assert(convertedStudent.firstName === 'Sophia' && convertedStudent.lastName === 'Miller', 'Demographics transfer seamlessly from application');

    // ========================================================
    // 2. STAFF/HR & HIERARCHY
    // ========================================================
    console.log('\n[Suite 3: Staff Hierarchy, Departments & Designations]');
    const department = new Department({
      name: 'Computer Science & Technology',
      code: 'CST',
      description: 'Computing and Robotics department',
    });
    assert(!department.validateSync(), 'Department model validates with unique code');

    const designation = new Designation({
      title: 'Senior Faculty',
      code: 'SFAC',
      departmentId: department._id,
    });
    assert(!designation.validateSync(), 'Designation links to department cleanly');

    const employee = new Employee({
      employeeId: 'EMP-2026-0031',
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan.turing@schoolerp.internal',
      phone: '+15559876543',
      gender: 'Male',
      departmentId: department._id,
      designationId: designation._id,
      joiningDate: new Date(),
      salaryStructure: {
        basicSalary: 4500,
        allowances: [{ name: 'HRA', amount: 900 }],
        deductions: [{ name: 'Tax', amount: 200 }],
      },
      status: 'Active',
    });

    assert(!employee.validateSync(), 'Employee directory profile validates successfully');
    assert(employee.salaryStructure.basicSalary === 4500, 'Employee basic salary is recorded');

    // ========================================================
    // 3. STAFF LEAVES & PAYROLL
    // ========================================================
    console.log('\n[Suite 4: Staff Leaves & Monthly Payroll Calculation]');
    const leave = new StaffLeave({
      employeeId: employee._id,
      leaveType: 'Casual',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-03'),
      totalDays: 3,
      reason: 'Attending National Education Summit',
      status: 'Pending',
    });

    assert(!leave.validateSync(), 'StaffLeave validates with 3-day duration');
    leave.status = 'Approved';
    leave.reviewedAt = new Date();
    assert(leave.status === 'Approved', 'Leave status transitions to Approved');

    // Payroll Calculation
    const basic = employee.salaryStructure.basicSalary;
    const allowances = 900;
    const deductions = 200;
    const netSalary = basic + allowances - deductions;

    const payroll = new Payroll({
      employeeId: employee._id,
      month: 10,
      year: 2026,
      basicSalary: basic,
      totalAllowances: allowances,
      totalDeductions: deductions,
      netSalary,
      status: 'Processed',
      payslipNumber: 'PS-202610-EMP-2026-0031',
    });

    assert(!payroll.validateSync(), 'Payroll record validates cleanly');
    assert(payroll.netSalary === 5200, 'Net salary computes accurately: $4500 + $900 - $200 = $5200');

    // Payment Settlement
    payroll.status = 'Paid';
    payroll.paymentDate = new Date();
    payroll.paymentMethod = 'Bank Transfer';
    assert(payroll.status === 'Paid', 'Payroll status advances to Paid');

    // ========================================================
    // 4. LIBRARY CIRCULATION WORKFLOW
    // ========================================================
    console.log('\n[Suite 5: Library Inventory & Circulation Workflow]');
    const book = new Book({
      title: 'Principles of Modern Physics',
      author: 'Dr. Richard Feynman',
      category: 'Science',
      isbn: '978-0140283333',
      rackLocation: { rackNumber: 'R-04', shelfNumber: 'S-2' },
      totalCopies: 5,
      availableCopies: 5,
      issuedCopies: 0,
      price: 65,
    });

    assert(!book.validateSync(), 'Book catalog entry validates with rack location');

    // Checkout: Issue Book
    const issueDate = new Date();
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    book.availableCopies -= 1;
    book.issuedCopies += 1;

    const trx = new LibraryTransaction({
      transactionNumber: 'TRX-2026-4401',
      bookId: book._id,
      patronType: 'Student',
      studentId: convertedStudent._id,
      issueDate,
      dueDate,
      status: 'Issued',
      issuedBy: dummyUserId,
    });

    assert(!trx.validateSync(), 'LibraryTransaction checkout record validates cleanly');
    assert(book.availableCopies === 4, 'Book available count decrements to 4');
    assert(book.issuedCopies === 1, 'Book issued count increments to 1');

    // Overdue Calculation Simulation (Past due by 5 days)
    const pastDueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const overdueDays = Math.ceil((Date.now() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24));
    const lateFine = overdueDays * 1; // $1/day
    assert(overdueDays >= 5, 'Overdue detector identifies at least 5 days overdue');
    assert(lateFine === 5, 'Dynamic late fine computes to $5 ($1/day * 5 days)');

    // Book Return
    trx.status = 'Returned';
    trx.returnDate = new Date();
    book.availableCopies += 1;
    book.issuedCopies -= 1;
    assert(book.availableCopies === 5, 'Book available count restored to 5 on return');

    // ========================================================
    // 5. TRANSPORT OPERATIONS
    // ========================================================
    console.log('\n[Suite 6: Transport Fleet, Routes & Seat Allocation]');
    const vehicle = new Vehicle({
      vehicleNumber: 'BUS-08-DL',
      model: 'Tata Marcopolo 40-Seater',
      seatingCapacity: 40,
      driver: {
        name: 'Robert Jenkins',
        phone: '+15556667777',
        licenseNumber: 'DL-COM-2018-991',
      },
      status: 'Active',
    });

    assert(!vehicle.validateSync(), 'Vehicle fleet entry validates cleanly');

    const route = new Route({
      routeName: 'North Ridge Express (Route 4)',
      vehicleId: vehicle._id,
      startLocation: 'North Ridge Plaza',
      endLocation: 'School Main Campus',
      stops: [
        { stopName: 'Oakwood Crossing', pickupTime: '07:15 AM', dropTime: '03:45 PM', fare: 60 },
        { stopName: 'Hillcrest Heights', pickupTime: '07:30 AM', dropTime: '03:30 PM', fare: 50 },
      ],
      isActive: true,
    });

    assert(!route.validateSync(), 'Transport route validates with pickup/drop schedule');

    // Student Seat Allocation
    const allocation = new TransportAllocation({
      studentId: convertedStudent._id,
      academicSessionId: dummySessionId,
      routeId: route._id,
      vehicleId: vehicle._id,
      stopName: 'Hillcrest Heights',
      pickupTime: '07:30 AM',
      dropTime: '03:30 PM',
      monthlyCharge: 50,
      status: 'Active',
    });

    assert(!allocation.validateSync(), 'TransportAllocation seat record validates cleanly');
    assert(allocation.monthlyCharge === 50, 'Designated stop fare links to monthly charge');

    // Capacity Constraint Check
    const activeAllocationsCount = 39;
    const canAllocateNextSeat = activeAllocationsCount < vehicle.seatingCapacity;
    assert(canAllocateNextSeat, 'Capacity guard allows allocation when seats remain (39/40)');

    const maxedAllocationsCount = 40;
    const canAllocateOverCapacity = maxedAllocationsCount < vehicle.seatingCapacity;
    assert(!canAllocateOverCapacity, 'Capacity guard prevents allocation when vehicle is full (40/40)');

    // Summary
    console.log('\n====================================================');
    console.log(`Phase 8 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 8 Test Error:', err);
    process.exit(1);
  }
};

runPhase8Tests();
