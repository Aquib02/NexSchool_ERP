import mongoose from 'mongoose';

const reportCardSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    subjectsSummary: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        subjectName: { type: String, required: true },
        marksObtained: { type: Number, required: true },
        totalMarks: { type: Number, required: true },
        grade: { type: String },
        remarks: { type: String },
      },
    ],
    totalMarksPossible: {
      type: Number,
      required: true,
    },
    totalMarksObtained: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    gpa: {
      type: Number,
    },
    overallGrade: {
      type: String,
    },
    classRank: {
      type: Number,
    },
    attendancePercentage: {
      type: Number,
    },
    teacherRemarks: {
      type: String,
      trim: true,
    },
    principalRemarks: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Withheld'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

// One report card per student per exam
reportCardSchema.index(
  { studentId: 1, examId: 1, academicSessionId: 1 },
  { unique: true }
);

export default mongoose.model('ReportCard', reportCardSchema);
