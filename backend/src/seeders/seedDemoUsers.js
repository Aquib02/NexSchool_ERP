import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import AcademicSession from '../models/AcademicSession.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Parent from '../models/Parent.js';
import Student from '../models/Student.js';

export const seedDemoUsers = async () => {
  console.log('[DemoSeed] Initializing Demo Profiles & Users for Teacher, Student, Parent, Accountant...');

  // 1. Roles Check
  const teacherRole = await Role.findOne({ name: 'TEACHER' });
  const studentRole = await Role.findOne({ name: 'STUDENT' });
  const parentRole = await Role.findOne({ name: 'PARENT' });
  const accountantRole = await Role.findOne({ name: 'ACCOUNTANT' });

  if (!teacherRole || !studentRole || !parentRole) {
    console.error('[DemoSeed] Missing required roles. Please run `npm run seed` first.');
    return;
  }

  // 2. Academic Session
  let session = await AcademicSession.findOne({ name: '2025-2026' });
  if (!session) {
    session = await AcademicSession.create({
      name: '2025-2026',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      isCurrent: true,
      status: 'active',
    });
    console.log('[DemoSeed] Created Academic Session 2025-2026');
  }

  // 3. Class & Section
  let schoolClass = await SchoolClass.findOne({ code: 'G10' });
  if (!schoolClass) {
    schoolClass = await SchoolClass.create({
      name: 'Grade 10',
      code: 'G10',
      numericOrder: 10,
      description: 'High School Sophomore Class',
    });
    console.log('[DemoSeed] Created Class Grade 10');
  }

  let sectionA = await Section.findOne({ name: 'A', classId: schoolClass._id });
  if (!sectionA) {
    sectionA = await Section.create({
      name: 'A',
      classId: schoolClass._id,
      capacity: 35,
    });
    console.log('[DemoSeed] Created Section A');
  }

  // 4. Subjects
  const subjectsData = [
    { name: 'Mathematics', code: 'MTH-101' },
    { name: 'General Science', code: 'SCI-101' },
    { name: 'English Literature', code: 'ENG-101' },
  ];
  for (const s of subjectsData) {
    const existing = await Subject.findOne({ code: s.code });
    if (!existing) {
      await Subject.create({
        name: s.name,
        code: s.code,
        classId: schoolClass._id,
        type: 'Core',
        credits: 4,
      });
    }
  }

  // 5. Department & Designation for Staff
  let acadDept = await Department.findOne({ code: 'ACAD' });
  if (!acadDept) {
    acadDept = await Department.create({
      name: 'Academic Department',
      code: 'ACAD',
      description: 'Teaching and pedagogical faculty',
    });
  }

  let teacherDesig = await Designation.findOne({ code: 'TCHR' });
  if (!teacherDesig) {
    teacherDesig = await Designation.create({
      title: 'Senior Mathematics Faculty',
      code: 'TCHR',
      departmentId: acadDept._id,
    });
  }

  // 6. Teacher Employee Profile & User
  let teacherEmp = await Employee.findOne({ employeeId: 'EMP-2026-0001' });
  if (!teacherEmp) {
    teacherEmp = await Employee.create({
      employeeId: 'EMP-2026-0001',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.jenkins@schoolerp.internal',
      phone: '+1-555-0199',
      gender: 'Female',
      departmentId: acadDept._id,
      designationId: teacherDesig._id,
      joiningDate: new Date('2024-08-01'),
      salaryStructure: { basicSalary: 4500 },
      status: 'Active',
    });
    console.log('[DemoSeed] Created Employee profile for Sarah Jenkins (EMP-2026-0001)');
  }

  let teacherUser = await User.findOne({ username: 'teacher' });
  if (!teacherUser) {
    teacherUser = new User({
      username: 'teacher',
      email: 'teacher@schoolerp.internal',
      password: 'Teacher@12345',
      role: teacherRole._id,
      employeeId: teacherEmp._id,
      isActive: true,
    });
    await teacherUser.save();
    console.log('[DemoSeed] ✓ TEACHER user created: Username="teacher", Password="Teacher@12345"');
  } else {
    teacherUser.employeeId = teacherEmp._id;
    await teacherUser.save();
    console.log('[DemoSeed] ✓ TEACHER user verified: Username="teacher"');
  }

  // 7. Parent & Student Profile & Users
  let parentDoc = await Parent.findOne({ primaryContactNumber: '+1-555-0876' });
  if (!parentDoc) {
    parentDoc = await Parent.create({
      parentId: 'PAR-2026-0001',
      fatherName: 'David Hansen',
      motherName: 'Claire Hansen',
      primaryContactNumber: '+1-555-0876',
      email: 'david.hansen@example.com',
      studentIds: [],
    });
  }

  let studentDoc = await Student.findOne({ studentId: 'STU-2026-0001' });
  if (!studentDoc) {
    studentDoc = await Student.create({
      studentId: 'STU-2026-0001',
      admissionNumber: 'ADM-2026-0001',
      firstName: 'Lucas',
      lastName: 'Hansen',
      gender: 'Male',
      dateOfBirth: new Date('2010-05-14'),
      classId: schoolClass._id,
      sectionId: sectionA._id,
      academicSessionId: session._id,
      parentId: parentDoc._id,
      rollNumber: 1,
      emergencyContact: {
        name: 'David Hansen',
        phone: '+1-555-0876',
        relationship: 'Father',
      },
      status: 'Active',
    });

    parentDoc.studentIds.push(studentDoc._id);
    await parentDoc.save();
    console.log('[DemoSeed] Created Student Lucas Hansen (STU-2026-0001) and linked to parent');
  }

  let studentUser = await User.findOne({ username: 'student' });
  if (!studentUser) {
    studentUser = new User({
      username: 'student',
      email: 'student@schoolerp.internal',
      password: 'Student@12345',
      role: studentRole._id,
      studentId: studentDoc._id,
      isActive: true,
    });
    await studentUser.save();
    console.log('[DemoSeed] ✓ STUDENT user created: Username="student", Password="Student@12345"');
  }

  let parentUser = await User.findOne({ username: 'parent' });
  if (!parentUser) {
    parentUser = new User({
      username: 'parent',
      email: 'parent@schoolerp.internal',
      password: 'Parent@12345',
      role: parentRole._id,
      parentId: parentDoc._id,
      isActive: true,
    });
    await parentUser.save();
    console.log('[DemoSeed] ✓ PARENT user created: Username="parent", Password="Parent@12345"');
  }

  if (accountantRole) {
    let accountantUser = await User.findOne({ username: 'accountant' });
    if (!accountantUser) {
      accountantUser = new User({
        username: 'accountant',
        email: 'accountant@schoolerp.internal',
        password: 'Accountant@12345',
        role: accountantRole._id,
        isActive: true,
      });
      await accountantUser.save();
      console.log('[DemoSeed] ✓ ACCOUNTANT user created: Username="accountant", Password="Accountant@12345"');
    }
  }

  console.log('[DemoSeed] All demo role credentials ready!');
};

if (process.argv[1]?.endsWith('seedDemoUsers.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDemoUsers();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[DemoSeed] Error during seeding:', err);
      process.exit(1);
    }
  })();
}

export default seedDemoUsers;
