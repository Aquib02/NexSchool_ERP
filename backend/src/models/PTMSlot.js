import mongoose from 'mongoose';

const ptmBookingSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
    },
    parentName: {
      type: String,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: {
      type: String,
      trim: true,
    },
    timeSlot: {
      type: String, // e.g. "09:00 AM - 09:15 AM"
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Booked', 'Completed', 'Cancelled', 'No-Show'],
      default: 'Booked',
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ptmSlotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'PTM Title is required'],
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      default: null,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String, // "09:00 AM"
      required: true,
    },
    endTime: {
      type: String, // "12:00 PM"
      required: true,
    },
    slotDurationMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    meetingMode: {
      type: String,
      enum: ['In-Person', 'Online Video', 'Hybrid'],
      default: 'In-Person',
    },
    meetingLocationOrLink: {
      type: String,
      default: 'Classroom / Auditorium',
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 12,
    },
    bookings: [ptmBookingSchema],
    status: {
      type: String,
      enum: ['Upcoming', 'In-Progress', 'Completed', 'Cancelled'],
      default: 'Upcoming',
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const PTMSlot = mongoose.model('PTMSlot', ptmSlotSchema);
export default PTMSlot;
