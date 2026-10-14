import mongoose from 'mongoose';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Employee from '../models/Employee.js';

console.log('----------------------------------------------------');
console.log('School ERP - Comprehensive Class Setup Test Suite');
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

const runComprehensiveClassTests = async () => {
  try {
    console.log('\n[Suite 1: SchoolClass Comprehensive Model Validation]');

    const teacherId = new mongoose.Types.ObjectId();
    const testClass = new SchoolClass({
      name: 'Class 10-Comprehensive',
      code: 'C10-COMP',
      numericOrder: 10,
      description: 'Comprehensive Secondary Board Class',
      floorNumber: '2nd Floor',
      building: 'Main Academic Block',
      roomNumber: 'Room 204',
      classTeacherId: teacherId,
      books: [
        {
          title: 'NCERT Mathematics Class 10',
          subject: 'Mathematics',
          author: 'NCERT Editorial',
          publisher: 'NCERT Publishing',
          isbn: '978-81-7450-489-0',
          isRequired: true,
        },
        {
          title: 'NCERT Science & Technology',
          subject: 'Science',
          author: 'National Science Council',
          publisher: 'NCERT',
          isbn: '978-81-7450-490-6',
          isRequired: true,
        },
        {
          title: 'Exemplar Problems in Physics',
          subject: 'Physics',
          author: 'Dr. H.C. Verma',
          publisher: 'Bharati Bhawan',
          isRequired: false,
        },
      ],
    });

    const validationErr = testClass.validateSync();
    assert(!validationErr, 'SchoolClass model with floor, building, coordinator, and books validates cleanly');
    assert(testClass.floorNumber === '2nd Floor', 'Floor number field persists accurately');
    assert(testClass.building === 'Main Academic Block', 'Building block field persists accurately');
    assert(testClass.roomNumber === 'Room 204', 'Room number field persists accurately');
    assert(testClass.classTeacherId.toString() === teacherId.toString(), 'Class Teacher / Coordinator reference captured');
    assert(testClass.books.length === 3, 'Books array captures 3 prescribed textbooks');
    assert(testClass.books[0].isRequired === true, 'Mandatory textbook flag preserves boolean state');
    assert(testClass.books[2].isRequired === false, 'Recommended reference textbook preserves optional state');

    console.log('\n[Suite 2: Section & Subject Linkage to Class]');
    const classId = testClass._id;

    const testSectionA = new Section({
      name: 'A',
      classId,
      capacity: 45,
      roomNumber: 'Room 204-A',
      classTeacherId: teacherId,
    });
    assert(!testSectionA.validateSync(), 'Section with capacity, roomNumber, and classTeacherId validates cleanly');

    const testSubject = new Subject({
      name: 'Advanced Mathematics',
      code: 'MTH-10-ADV',
      type: 'Core',
      classId,
      totalMarks: 100,
      passMarks: 40,
      assignedTeacherIds: [teacherId],
    });
    assert(!testSubject.validateSync(), 'Subject with passMarks, totalMarks, and assignedTeacherIds validates cleanly');
    assert(testSubject.assignedTeacherIds[0].toString() === teacherId.toString(), 'Subject assigned teacher ID links correctly');

    console.log('\n====================================================');
    console.log(`Class Setup Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runComprehensiveClassTests();
