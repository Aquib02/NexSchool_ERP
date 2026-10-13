import mongoose from 'mongoose';
import CommunicationLog from '../models/CommunicationLog.js';
import PTMSlot from '../models/PTMSlot.js';
import ChatMessage from '../models/ChatMessage.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudyMaterial from '../models/StudyMaterial.js';
import BusLiveLocation from '../models/BusLiveLocation.js';
import BusBoardingLog from '../models/BusBoardingLog.js';
import Certificate from '../models/Certificate.js';
import AtRiskStudent from '../models/AtRiskStudent.js';

console.log('====================================================');
console.log('NexSchool ERP - Verification of Features 2, 4, 5, 6, 7');
console.log('====================================================');

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

const runTests = async () => {
  try {
    const dummyId1 = new mongoose.Types.ObjectId();
    const dummyId2 = new mongoose.Types.ObjectId();
    const dummyId3 = new mongoose.Types.ObjectId();

    // ----------------------------------------------------
    // Feature 2: Communication, WhatsApp/SMS, PTM, Chat
    // ----------------------------------------------------
    console.log('\n[Feature 2: Multi-Channel Communication, PTM & Chat]');

    const commLog = new CommunicationLog({
      channel: 'WhatsApp',
      recipientType: 'Parent',
      recipientPhone: '+91-9876543210',
      recipientName: 'Sarah Jenkins',
      triggerEvent: 'ATTENDANCE_ABSENT',
      messageBody: 'Dear Parent, your child was marked absent today.',
      status: 'Delivered',
      gatewayReference: 'WA-2026-9901',
    });
    const commErr = commLog.validateSync();
    assert(!commErr, 'CommunicationLog model validates correctly');

    const ptmSlot = new PTMSlot({
      title: 'Term 1 Parent-Teacher Conference',
      teacherId: dummyId1,
      teacherName: 'Dr. Evelyn Reed',
      date: new Date(2026, 3, 20),
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      slotDurationMinutes: 15,
      meetingMode: 'In-Person',
      bookings: [
        {
          parentId: dummyId2,
          parentName: 'David Miller',
          studentId: dummyId3,
          studentName: 'Lucas Miller',
          timeSlot: '09:15 AM - 09:30 AM',
          status: 'Booked',
        },
      ],
    });
    const ptmErr = ptmSlot.validateSync();
    assert(!ptmErr, 'PTMSlot model with booking subdocument validates correctly');

    const chatMsg = new ChatMessage({
      senderId: dummyId1,
      senderName: 'Principal Martinez',
      senderRole: 'PRINCIPAL',
      channelName: 'FACULTY',
      message: 'Staff briefing scheduled for 3 PM in Conference Hall.',
    });
    const chatErr = chatMsg.validateSync();
    assert(!chatErr, 'ChatMessage model validates correctly');

    // ----------------------------------------------------
    // Feature 4: Learning Management System (LMS)
    // ----------------------------------------------------
    console.log('\n[Feature 4: LMS Submissions, Quizzes & Study Vault]');

    const submission = new AssignmentSubmission({
      homeworkId: dummyId1,
      studentId: dummyId2,
      submissionText: 'Completed calculus problem set 4.',
      attachments: [{ fileName: 'Calculus_PS4.pdf', fileUrl: 'https://cdn.example.com/ps4.pdf' }],
      score: 95,
      maxScore: 100,
      grade: 'A+',
      teacherFeedback: 'Outstanding work with step-by-step proofs.',
      status: 'Graded',
    });
    const subErr = submission.validateSync();
    assert(!subErr, 'AssignmentSubmission model validates correctly');

    const quiz = new Quiz({
      title: 'Cell Biology Rapid Quiz',
      classId: dummyId1,
      subjectId: dummyId2,
      durationMinutes: 15,
      totalMarks: 5,
      passMarks: 3,
      questions: [
        {
          questionText: 'What is the primary powerhouse organelle of eukaryotic cells?',
          options: ['Ribosome', 'Mitochondria', 'Golgi Body', 'Nucleus'],
          correctOptionIndex: 1,
          marks: 1,
        },
      ],
      createdBy: dummyId3,
    });
    const quizErr = quiz.validateSync();
    assert(!quizErr, 'Quiz model with question bank validates correctly');

    const attempt = new QuizAttempt({
      quizId: dummyId1,
      studentId: dummyId2,
      answers: [{ questionId: dummyId3, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 }],
      totalQuestions: 1,
      correctAnswersCount: 1,
      score: 1,
      maxScore: 1,
      percentage: 100,
      passed: true,
      timeSpentSeconds: 45,
    });
    const attemptErr = attempt.validateSync();
    assert(!attemptErr, 'QuizAttempt model validates correctly');

    const material = new StudyMaterial({
      title: 'Organic Chemistry Revision Notes',
      classId: dummyId1,
      subjectId: dummyId2,
      resourceType: 'PDF',
      fileUrl: 'https://cdn.example.com/chemistry_ch3.pdf',
      fileName: 'Chemistry_Ch3_Notes.pdf',
      uploadedBy: dummyId3,
    });
    const matErr = material.validateSync();
    assert(!matErr, 'StudyMaterial model validates correctly');

    // ----------------------------------------------------
    // Feature 5: Live GPS Bus Tracking & Fleet Safety
    // ----------------------------------------------------
    console.log('\n[Feature 5: Live GPS Bus Tracking & Fleet Safety]');

    const busLoc = new BusLiveLocation({
      vehicleId: dummyId1,
      routeId: dummyId2,
      latitude: 28.6139,
      longitude: 77.2090,
      speedKmH: 42,
      heading: 'NE',
      currentStopName: 'North Gate',
      nextStopName: 'Valley Station',
      etaNextStopMinutes: 5,
      status: 'On Route',
      fuelPercent: 88,
    });
    const busLocErr = busLoc.validateSync();
    assert(!busLocErr, 'BusLiveLocation model validates correctly');

    const boarding = new BusBoardingLog({
      studentId: dummyId1,
      routeId: dummyId2,
      vehicleId: dummyId3,
      tripType: 'Morning_Pickup',
      boardingStatus: 'Boarded',
      stopName: 'Valley Station',
    });
    const boardErr = boarding.validateSync();
    assert(!boardErr, 'BusBoardingLog model validates correctly');

    // ----------------------------------------------------
    // Feature 6: Certificate & Document Generator Engine
    // ----------------------------------------------------
    console.log('\n[Feature 6: Certificate & Document Generator Engine]');

    const cert = new Certificate({
      certificateNumber: 'TC-2026-77821',
      certificateType: 'TRANSFER_CERTIFICATE',
      studentId: dummyId1,
      studentName: 'Alexander Hayes',
      admissionNumber: 'ADM-2026-9021',
      details: {
        className: 'Class 10',
        sectionName: 'A',
        conduct: 'Exemplary',
        reasonForLeaving: 'Parent Relocation',
      },
      verificationHash: 'A8B9C10D2E3F4G5H',
      qrCodeString: 'NEX-VERIFY:TC-2026-77821',
      issuedBy: dummyId2,
    });
    const certErr = cert.validateSync();
    assert(!certErr, 'Certificate model with QR and verification hash validates correctly');

    // ----------------------------------------------------
    // Feature 7: AI & Predictive Educational Analytics
    // ----------------------------------------------------
    console.log('\n[Feature 7: AI & Predictive Analytics]');

    const atRisk = new AtRiskStudent({
      studentId: dummyId1,
      riskLevel: 'Critical',
      riskScore: 78,
      attendanceRate: 64,
      academicAverageScore: 48,
      pendingHomeworkCount: 4,
      identifiedFactors: [
        { factor: 'Chronic Absenteeism (64% attendance)', severity: 'High' },
        { factor: 'Failing Mathematics and Science exams', severity: 'High' },
      ],
      recommendedInterventions: [
        'Mandatory Parent-Teacher Counseling Session',
        'Assign Dedicated Peer Academic Mentor',
      ],
      counselingStatus: 'Scheduled',
    });
    const atRiskErr = atRisk.validateSync();
    assert(!atRiskErr, 'AtRiskStudent model validates correctly');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runTests();
