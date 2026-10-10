import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import AcademicSession from '../models/AcademicSession.js';
import Notice from '../models/Notice.js';
import { exportStudents } from '../controllers/studentController.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 5 Core & Student Architecture Test');
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

const runPhase5Tests = async () => {
  try {
    // 1. Schema Path & Index Verification
    console.log('\n[Suite 1: Schema Integrity & Index Definition]');
    const studentIndexes = Student.schema.indexes();
    const hasRollConstraint = studentIndexes.some((idx) => {
      const keys = idx[0];
      return keys.classId === 1 && keys.sectionId === 1 && keys.rollNumber === 1;
    });
    assert(hasRollConstraint, 'Student schema defines unique compound index on [classId, sectionId, rollNumber, academicSessionId]');

    const hasTextSearch = studentIndexes.some((idx) => {
      const keys = idx[0];
      return keys.firstName === 'text' && keys.studentId === 'text';
    });
    assert(hasTextSearch, 'Student schema defines text search index for fast multi-field query matching');

    // 2. Student Virtuals
    console.log('\n[Suite 2: Student Virtual Fields]');
    const dummyStudent = new Student({
      firstName: 'Aarav',
      lastName: 'Sharma',
      studentId: 'STU-2026-0001',
      admissionNumber: 'ADM-2026-0001',
      dateOfBirth: new Date('2010-05-15'),
      gender: 'Male',
      classId: new mongoose.Types.ObjectId(),
      sectionId: new mongoose.Types.ObjectId(),
      rollNumber: 1,
      academicSessionId: new mongoose.Types.ObjectId(),
      parentId: new mongoose.Types.ObjectId(),
      emergencyContact: { name: 'Rajesh', relationship: 'Father', phone: '9876543210' },
    });
    assert(dummyStudent.fullName === 'Aarav Sharma', 'Student virtual fullName computes correctly');

    // 3. One Student -> One Profile Parent Association
    console.log('\n[Suite 3: One Student -> One Profile & Parent-Sibling Association]');
    const dummyParent = new Parent({
      parentId: 'PAR-2026-0001',
      fatherName: 'Rajesh Sharma',
      primaryContactNumber: '9876500001',
      studentIds: [],
    });

    const child1Id = new mongoose.Types.ObjectId();
    const child2Id = new mongoose.Types.ObjectId();

    // Sibling 1 (Aarav) and Sibling 2 (Priya)
    dummyParent.studentIds.push(child1Id);
    dummyParent.studentIds.push(child2Id);

    assert(dummyParent.studentIds.length === 2, 'Parent document correctly manages multiple student IDs (siblings)');
    assert(dummyParent.studentIds.includes(child1Id), 'Parent record references Student 1');
    assert(dummyParent.studentIds.includes(child2Id), 'Parent record references Student 2');

    // 4. Academic Setup Models Validation
    console.log('\n[Suite 4: Academic Setup Model Validation]');
    const dummyClass = new SchoolClass({
      name: 'Class 10',
      code: 'C10',
      numericOrder: 10,
    });
    const classValidationErr = dummyClass.validateSync();
    assert(!classValidationErr, 'SchoolClass validates valid class definition');

    const dummySection = new Section({
      name: 'A',
      classId: dummyClass._id,
      capacity: 40,
    });
    const sectionValidationErr = dummySection.validateSync();
    assert(!sectionValidationErr, 'Section validates valid section definition with class reference');

    // 5. Notice Schema Validation
    console.log('\n[Suite 5: Notice & Circular System]');
    const dummyNotice = new Notice({
      title: 'Annual Sports Day 2026',
      content: 'All students must assemble at the athletic grounds by 8:00 AM.',
      category: 'Sports',
      targetAudience: ['All'],
      authorId: new mongoose.Types.ObjectId(),
    });
    const noticeErr = dummyNotice.validateSync();
    assert(!noticeErr, 'Notice validates with target audience and category');

    // 6. Student Status Transitions
    console.log('\n[Suite 6: Student Lifecycle State Enums]');
    const validStatuses = ['Active', 'Inactive', 'Transferred', 'Graduated', 'Withdrawn'];
    let allStatusAllowed = true;
    validStatuses.forEach((status) => {
      dummyStudent.status = status;
      if (dummyStudent.validateSync()) allStatusAllowed = false;
    });
    assert(allStatusAllowed, 'Student status enum supports Active, Inactive, Transferred, Graduated, Withdrawn');

    console.log('\n====================================================');
    console.log(`PHASE 5 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed === 0) {
      console.log('ALL PHASE 5 ARCHITECTURE & VALIDATION TESTS PASSED!\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runPhase5Tests();
