import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import AcademicSession from '../models/AcademicSession.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Timetable from '../models/Timetable.js';
import Exam from '../models/Exam.js';
import Mark from '../models/Mark.js';
import Homework from '../models/Homework.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Quiz from '../models/Quiz.js';
import StudyMaterial from '../models/StudyMaterial.js';
import PTMSlot from '../models/PTMSlot.js';
import Attendance from '../models/Attendance.js';

export const seedTeacherDemoData = async () => {
  console.log('[TeacherSeed] ===================================================');
  console.log('[TeacherSeed] Initializing Comprehensive Teacher Demo Data Seeder');
  console.log('[TeacherSeed] ===================================================');

  // 1. Resolve Teacher User & Employee
  const teacherUser = await User.findOne({ username: 'teacher' }).populate('role');
  if (!teacherUser) {
    throw new Error('Teacher user "teacher" not found. Please run seedDemoUsers first.');
  }

  let teacherEmp = await Employee.findById(teacherUser.employeeId);
  if (!teacherEmp) {
    teacherEmp = await Employee.findOne({ email: 'sarah.jenkins@schoolerp.internal' });
    if (teacherEmp) {
      teacherUser.employeeId = teacherEmp._id;
      await teacherUser.save();
    }
  }

  if (!teacherEmp) {
    throw new Error('Teacher employee profile (Sarah Jenkins) not found.');
  }

  console.log(`[TeacherSeed] ✓ Found Teacher: ${teacherEmp.firstName} ${teacherEmp.lastName} (${teacherUser.username})`);

  // 2. Resolve Academic Session, Class, Section, Subjects, Students
  const session = await AcademicSession.findOne({ isCurrent: true }) || await AcademicSession.findOne();
  if (!session) throw new Error('Academic session not found.');

  const schoolClass = await SchoolClass.findOne({ code: 'G10' }) || await SchoolClass.findOne();
  if (!schoolClass) throw new Error('Class Grade 10 not found.');

  const sectionA = await Section.findOne({ classId: schoolClass._id, name: 'A' }) || await Section.findOne({ classId: schoolClass._id });
  if (!sectionA) throw new Error('Section A not found.');

  const mathSubject = await Subject.findOne({ code: 'MTH-101' }) || await Subject.findOne({ name: /math/i });
  const scienceSubject = await Subject.findOne({ code: 'SCI-101' }) || await Subject.findOne({ name: /science/i });
  const englishSubject = await Subject.findOne({ code: 'ENG-101' }) || await Subject.findOne({ name: /english/i });

  // Ensure demo students are set to Active status
  await Student.updateMany(
    { classId: schoolClass._id, sectionId: sectionA._id },
    { $set: { status: 'Active' } }
  );

  const students = await Student.find({ classId: schoolClass._id, sectionId: sectionA._id, status: 'Active' });
  console.log(`[TeacherSeed] ✓ Found ${students.length} active students in ${schoolClass.name} - Section ${sectionA.name}`);

  const lucas = students.find((s) => s.firstName === 'Lucas') || students[0];
  const gaurav = students.find((s) => s.firstName === 'Gaurav') || students[1];
  const mohammad = students.find((s) => s.firstName === 'Mohammad') || students[2];

  // 3. SEED TIMETABLE (Monday through Friday)
  console.log('[TeacherSeed] Seeding Monday-Friday Timetable...');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (const day of daysOfWeek) {
    const periods = [
      {
        periodNumber: 1,
        startTime: '08:30',
        endTime: '09:15',
        subjectId: mathSubject?._id,
        teacherId: teacherEmp._id, // Sarah Jenkins
        roomNumber: 'Room 204',
        isBreak: false,
      },
      {
        periodNumber: 2,
        startTime: '09:15',
        endTime: '10:00',
        subjectId: scienceSubject?._id,
        teacherId: null,
        roomNumber: 'Room 204',
        isBreak: false,
      },
      {
        periodNumber: 3,
        startTime: '10:00',
        endTime: '10:45',
        subjectId: englishSubject?._id,
        teacherId: null,
        roomNumber: 'Room 204',
        isBreak: false,
      },
      {
        periodNumber: 4,
        startTime: '10:45',
        endTime: '11:15',
        subjectId: null,
        teacherId: null,
        roomNumber: 'Cafeteria / Courtyard',
        isBreak: true,
      },
      {
        periodNumber: 5,
        startTime: '11:15',
        endTime: '12:00',
        subjectId: mathSubject?._id,
        teacherId: teacherEmp._id, // Sarah Jenkins (Math Problem Solving / Lab)
        roomNumber: 'Math Lab 1',
        isBreak: false,
      },
      {
        periodNumber: 6,
        startTime: '12:00',
        endTime: '12:45',
        subjectId: scienceSubject?._id,
        teacherId: null,
        roomNumber: 'Physics Lab',
        isBreak: false,
      },
    ];

    await Timetable.findOneAndUpdate(
      {
        academicSessionId: session._id,
        classId: schoolClass._id,
        sectionId: sectionA._id,
        dayOfWeek: day,
      },
      {
        academicSessionId: session._id,
        classId: schoolClass._id,
        sectionId: sectionA._id,
        dayOfWeek: day,
        periods,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('[TeacherSeed] ✓ Timetables for Mon-Fri seeded successfully.');

  // 4. SEED ATTENDANCE (Today & Yesterday)
  console.log('[TeacherSeed] Seeding Class Attendance Register...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const datesToSeed = [today, yesterday];

  for (const d of datesToSeed) {
    if (lucas) {
      await Attendance.findOneAndUpdate(
        { studentId: lucas._id, date: d },
        {
          attendanceType: 'Student',
          studentId: lucas._id,
          classId: schoolClass._id,
          sectionId: sectionA._id,
          academicSessionId: session._id,
          date: d,
          status: 'Present',
          remarks: 'On time and actively participating',
          markedBy: teacherUser._id,
        },
        { upsert: true }
      );
    }
    if (gaurav) {
      await Attendance.findOneAndUpdate(
        { studentId: gaurav._id, date: d },
        {
          attendanceType: 'Student',
          studentId: gaurav._id,
          classId: schoolClass._id,
          sectionId: sectionA._id,
          academicSessionId: session._id,
          date: d,
          status: 'Present',
          remarks: 'Present in class',
          markedBy: teacherUser._id,
        },
        { upsert: true }
      );
    }
    if (mohammad) {
      await Attendance.findOneAndUpdate(
        { studentId: mohammad._id, date: d },
        {
          attendanceType: 'Student',
          studentId: mohammad._id,
          classId: schoolClass._id,
          sectionId: sectionA._id,
          academicSessionId: session._id,
          date: d,
          status: 'Absent',
          remarks: 'Medical leave approved by parent notice',
          markedBy: teacherUser._id,
        },
        { upsert: true }
      );
    }
  }
  console.log('[TeacherSeed] ✓ Attendance records seeded for today & yesterday.');

  // 5. SEED EXAMS & MARKS
  console.log('[TeacherSeed] Seeding Scheduled Examination & Subject Marks...');
  let exam = await Exam.findOne({ name: 'Mid-Term Academic Examination 2026' });
  if (!exam) {
    exam = await Exam.create({
      name: 'Mid-Term Academic Examination 2026',
      examType: 'Mid-Term',
      academicSessionId: session._id,
      classes: [schoolClass._id],
      startDate: new Date('2026-10-20'),
      endDate: new Date('2026-10-30'),
      status: 'Scheduled',
      schedule: [
        {
          classId: schoolClass._id,
          subjectId: mathSubject._id,
          examDate: new Date('2026-10-22'),
          startTime: '09:00',
          endTime: '12:00',
          totalMarks: 100,
          passingMarks: 40,
          roomNumber: 'Examination Hall A',
        },
        {
          classId: schoolClass._id,
          subjectId: scienceSubject._id,
          examDate: new Date('2026-10-25'),
          startTime: '09:00',
          endTime: '12:00',
          totalMarks: 100,
          passingMarks: 40,
          roomNumber: 'Examination Hall A',
        },
        {
          classId: schoolClass._id,
          subjectId: englishSubject._id,
          examDate: new Date('2026-10-28'),
          startTime: '09:00',
          endTime: '12:00',
          totalMarks: 100,
          passingMarks: 40,
          roomNumber: 'Examination Hall A',
        },
      ],
    });
  }

  // Seed sample marks for Lucas and Gaurav in Math (leave Mohammad Khan unentered so teacher can test entering marks!)
  if (lucas && mathSubject) {
    await Mark.findOneAndUpdate(
      { examId: exam._id, studentId: lucas._id, subjectId: mathSubject._id },
      {
        examId: exam._id,
        studentId: lucas._id,
        academicSessionId: session._id,
        classId: schoolClass._id,
        sectionId: sectionA._id,
        subjectId: mathSubject._id,
        marksObtained: 88,
        totalMarks: 100,
        grade: 'A',
        isAbsent: false,
        remarks: 'Excellent analytical proofs and problem solving.',
        enteredBy: teacherEmp._id,
      },
      { upsert: true }
    );
  }

  if (gaurav && mathSubject) {
    await Mark.findOneAndUpdate(
      { examId: exam._id, studentId: gaurav._id, subjectId: mathSubject._id },
      {
        examId: exam._id,
        studentId: gaurav._id,
        academicSessionId: session._id,
        classId: schoolClass._id,
        sectionId: sectionA._id,
        subjectId: mathSubject._id,
        marksObtained: 92,
        totalMarks: 100,
        grade: 'A+',
        isAbsent: false,
        remarks: 'Outstanding speed in algebraic derivations.',
        enteredBy: teacherEmp._id,
      },
      { upsert: true }
    );
  }
  console.log('[TeacherSeed] ✓ Exam and sample student marks seeded.');

  // 6. SEED HOMEWORK & SUBMISSIONS (with a pending submission ready for grading)
  console.log('[TeacherSeed] Seeding Homework Assignments & Student Submissions...');
  let hw2 = await Homework.findOne({ title: "Newton's Laws & Dynamics Problem Set" });
  if (!hw2) {
    hw2 = await Homework.create({
      title: "Newton's Laws & Dynamics Problem Set",
      description: "Solve questions 1 through 15 on friction, inclined planes, and free body force diagrams.",
      academicSessionId: session._id,
      classId: schoolClass._id,
      sectionId: sectionA._id,
      subjectId: scienceSubject._id,
      assignedBy: teacherEmp._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
      attachments: [
        {
          title: 'Physics_Worksheet_Ch4.pdf',
          fileUrl: 'https://cdn.example.com/materials/physics_ch4.pdf',
        },
      ],
      submissions: [],
    });
  }

  // Create pending submission for Mohammad Khan so the teacher can test the "Grade & Feedback" modal live!
  if (mohammad) {
    const existingSub = await AssignmentSubmission.findOne({
      homeworkId: hw2._id,
      studentId: mohammad._id,
    });

    if (!existingSub) {
      await AssignmentSubmission.create({
        homeworkId: hw2._id,
        studentId: mohammad._id,
        submissionText: 'Respected teacher, I have completed all 15 dynamics questions. Step-by-step vector solutions and diagrams are detailed in my submission.',
        attachments: [
          {
            fileName: 'Mohammad_Khan_Physics_HW2.pdf',
            fileUrl: 'https://cdn.example.com/submissions/mohammad_hw2.pdf',
            fileSize: '1.8 MB',
          },
        ],
        submissionDate: new Date(),
        status: 'Submitted', // PENDING GRADING!
        score: null,
        maxScore: 100,
        grade: '',
        teacherFeedback: '',
      });
      console.log('[TeacherSeed] ✓ Pending submission created for Mohammad Khan (Ready for teacher grading test)');
    }
  }

  // 7. SEED LMS CBT QUIZ
  console.log('[TeacherSeed] Seeding LMS CBT Quiz...');
  let quiz = await Quiz.findOne({ title: 'Quadratic Equations & Polynomials CBT Assessment' });
  if (!quiz) {
    quiz = await Quiz.create({
      title: 'Quadratic Equations & Polynomials CBT Assessment',
      description: 'Timed assessment testing concepts of quadratic roots, discriminants, and parabola vertex analysis.',
      classId: schoolClass._id,
      subjectId: mathSubject._id,
      durationMinutes: 20,
      totalMarks: 10,
      passMarks: 4,
      status: 'Published',
      createdBy: teacherUser._id,
      questions: [
        {
          questionText: 'For the quadratic equation ax^2 + bx + c = 0, what does a discriminant (b^2 - 4ac) < 0 signify?',
          options: [
            'Two distinct real roots',
            'Two equal real roots',
            'No real roots (two complex conjugate roots)',
            'Infinitely many solutions',
          ],
          correctOptionIndex: 2,
          marks: 4,
          explanation: 'When b^2 - 4ac < 0, the root term is imaginary, producing complex roots with no real solutions.',
        },
        {
          questionText: 'What is the sum of the roots for the quadratic equation 2x^2 - 8x + 6 = 0?',
          options: ['-4', '4', '3', '-3'],
          correctOptionIndex: 1,
          marks: 3,
          explanation: 'By Vieta formulas, sum of roots = -b / a = -(-8) / 2 = 8 / 2 = 4.',
        },
        {
          questionText: 'What is the x-coordinate of the vertex of the parabola defined by y = x^2 - 6x + 5?',
          options: ['3', '-3', '6', '5'],
          correctOptionIndex: 0,
          marks: 3,
          explanation: 'The vertex x-coordinate is given by x = -b / (2a) = -(-6) / (2*1) = 3.',
        },
      ],
    });
    console.log('[TeacherSeed] ✓ CBT Quiz created with 3 test questions.');
  }

  // 8. SEED STUDY MATERIALS
  console.log('[TeacherSeed] Seeding Study Material Resources...');
  const existingMat1 = await StudyMaterial.findOne({ title: 'Grade 10 Mathematics - Trigonometry & Calculus Formula Guide' });
  if (!existingMat1) {
    await StudyMaterial.create({
      title: 'Grade 10 Mathematics - Trigonometry & Calculus Formula Guide',
      description: 'Comprehensive high-yield reference cheat-sheet containing Pythagorean identities, unit circle angles, and introductory differential principles.',
      classId: schoolClass._id,
      subjectId: mathSubject._id,
      resourceType: 'PDF',
      fileUrl: 'https://cdn.example.com/materials/Grade10_Math_Formula_Guide.pdf',
      fileName: 'Grade10_Math_Formula_Guide.pdf',
      fileSize: '2.4 MB',
      uploadedBy: teacherUser._id,
      academicSessionId: session._id,
    });
  }

  const existingMat2 = await StudyMaterial.findOne({ title: 'Physics Laboratory Manual & Kinematics Procedures' });
  if (!existingMat2) {
    await StudyMaterial.create({
      title: 'Physics Laboratory Manual & Kinematics Procedures',
      description: 'Step-by-step experiment instructions for measurement of acceleration due to gravity and frictional coefficients.',
      classId: schoolClass._id,
      subjectId: scienceSubject._id,
      resourceType: 'PDF',
      fileUrl: 'https://cdn.example.com/materials/Physics_Lab_Manual_2026.pdf',
      fileName: 'Physics_Lab_Manual_2026.pdf',
      fileSize: '3.6 MB',
      uploadedBy: teacherUser._id,
      academicSessionId: session._id,
    });
  }
  console.log('[TeacherSeed] ✓ Study materials published in Vault.');

  // 9. SEED PTM CONFERENCE SESSIONS
  console.log('[TeacherSeed] Seeding PTM Conference Sessions...');
  const parentDavid = await Parent.findOne({ primaryContactNumber: '+1-555-0876' }) || await Parent.findOne();

  const ptmDate = new Date();
  ptmDate.setDate(ptmDate.getDate() + 3); // 3 days from now
  ptmDate.setHours(9, 0, 0, 0);

  const existingPtm = await PTMSlot.findOne({ title: 'Q1 Grade 10 Academic Progress & Well-being Conference' });
  if (!existingPtm) {
    await PTMSlot.create({
      title: 'Q1 Grade 10 Academic Progress & Well-being Conference',
      teacherId: teacherEmp._id,
      teacherName: `${teacherEmp.firstName} ${teacherEmp.lastName}`,
      classId: schoolClass._id,
      date: ptmDate,
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      slotDurationMinutes: 15,
      meetingMode: 'In-Person',
      meetingLocationOrLink: 'Room 204 (Academic Wing)',
      maxCapacity: 12,
      status: 'Upcoming',
      remarks: 'Individual 15-minute consultations regarding term progress and exam preparation.',
      bookings: parentDavid && lucas
        ? [
            {
              parentId: parentDavid._id,
              parentName: `${parentDavid.fatherName || 'David Hansen'}`,
              studentId: lucas._id,
              studentName: `${lucas.firstName} ${lucas.lastName}`,
              timeSlot: '09:15 AM - 09:30 AM',
              notes: 'Discussing advanced mathematics olympiad preparation and homework pace.',
              status: 'Booked',
              bookedAt: new Date(),
            },
          ]
        : [],
    });
    console.log('[TeacherSeed] ✓ PTM Conference session seeded with booked slot.');
  }

  console.log('[TeacherSeed] ===================================================');
  console.log('[TeacherSeed] Demo Data Seeding Completed Successfully for Teacher!');
  console.log('[TeacherSeed] ===================================================');
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedTeacherDemoData.js')) {
  (async () => {
    try {
      await connectDB();
      await seedTeacherDemoData();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[TeacherSeed] Error executing seeder:', err);
      process.exit(1);
    }
  })();
}

export default seedTeacherDemoData;
