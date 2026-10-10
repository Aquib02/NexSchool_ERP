import mongoose from 'mongoose';

const securityIncidentSchema = new mongoose.Schema(
  {
    incidentNumber: {
      type: String,
      required: [true, 'Incident number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    incidentType: {
      type: String,
      enum: [
        'Trespassing / Unauthorized Entry',
        'Theft / Property Loss',
        'Vandalism',
        'Student Disciplinary / Altercation',
        'Medical Emergency',
        'Fire / Safety Hazard',
        'Vehicle Incident',
        'Other',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      index: true,
    },
    incidentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    location: {
      type: String,
      required: [true, 'Incident location is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    partiesInvolved: {
      type: String,
      trim: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionTaken: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Reported', 'Investigating', 'Resolved', 'Escalated to Authorities'],
      default: 'Reported',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('SecurityIncident', securityIncidentSchema);
