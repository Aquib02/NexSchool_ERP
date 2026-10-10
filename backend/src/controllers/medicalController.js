import mongoose from 'mongoose';
import MedicalRecord from '../models/MedicalRecord.js';
import MedicalVisit from '../models/MedicalVisit.js';
import MedicineInventory from '../models/MedicineInventory.js';
import Student from '../models/Student.js';

const generateVisitNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MED-${year}-${rand}`;
};

// ==========================================
// 1. STUDENT MEDICAL RECORDS
// ==========================================

export const getMedicalRecords = async (req, res, next) => {
  try {
    const { bloodGroup, hasAllergies, search } = req.query;
    let query = {};

    if (bloodGroup && bloodGroup !== 'All') {
      query.bloodGroup = bloodGroup;
    }

    if (hasAllergies === 'true') {
      query['allergies.0'] = { $exists: true };
    }

    let records = await MedicalRecord.find(query)
      .populate({
        path: 'studentId',
        select: 'admissionNumber firstName lastName gender classId sectionId emergencyContact',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .sort({ updatedAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter((rec) => {
        const stu = rec.studentId;
        if (!stu) return false;
        const fullName = `${stu.firstName} ${stu.lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          (stu.admissionNumber && stu.admissionNumber.toLowerCase().includes(searchLower))
        );
      });
    }

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getMedicalRecordByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const student = await Student.findById(studentId)
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .populate('parentId', 'fatherName motherName primaryPhone');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const medicalRecord = await MedicalRecord.findOne({ studentId });
    const pastVisits = await MedicalVisit.find({ studentId }).sort({ visitDate: -1 }).limit(10);

    return res.status(200).json({
      success: true,
      data: {
        student,
        medicalRecord: medicalRecord || null,
        pastVisits,
        criticalAlerts: {
          hasSevereAllergies: medicalRecord?.allergies?.some(
            (a) => a.severity === 'Severe' || a.severity === 'Critical'
          ) || false,
          chronicConditions: medicalRecord?.chronicConditions || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertMedicalRecord = async (req, res, next) => {
  try {
    const {
      studentId,
      bloodGroup,
      heightCm,
      weightKg,
      allergies,
      chronicConditions,
      regularMedications,
      immunizations,
      vision,
      emergencyHospital,
      familyPhysician,
    } = req.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updatePayload = {
      studentId,
      ...(bloodGroup && { bloodGroup }),
      ...(heightCm !== undefined && { heightCm }),
      ...(weightKg !== undefined && { weightKg }),
      ...(allergies && { allergies }),
      ...(chronicConditions && { chronicConditions }),
      ...(regularMedications && { regularMedications }),
      ...(immunizations && { immunizations }),
      ...(vision && { vision }),
      ...(emergencyHospital && { emergencyHospital }),
      ...(familyPhysician && { familyPhysician }),
    };

    const record = await MedicalRecord.findOneAndUpdate(
      { studentId },
      updatePayload,
      { new: true, upsert: true, runValidators: true }
    ).populate({
      path: 'studentId',
      select: 'admissionNumber firstName lastName',
    });

    return res.status(200).json({
      success: true,
      message: 'Student health profile saved successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CLINIC VISITS & INFIRMARY LOGS
// ==========================================

export const getMedicalVisits = async (req, res, next) => {
  try {
    const { patronType, status, studentId, date } = req.query;
    let query = {};

    if (patronType && patronType !== 'All') {
      query.patronType = patronType;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      query.studentId = studentId;
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.visitDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const visits = await MedicalVisit.find(query)
      .populate({
        path: 'studentId',
        select: 'admissionNumber firstName lastName classId sectionId emergencyContact',
        populate: [
          { path: 'classId', select: 'name code' },
          { path: 'sectionId', select: 'name' },
        ],
      })
      .populate('employeeId', 'employeeId firstName lastName departmentId')
      .populate('nurseInCharge', 'username firstName lastName')
      .sort({ visitDate: -1 });

    return res.status(200).json({
      success: true,
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    next(error);
  }
};

export const createMedicalVisit = async (req, res, next) => {
  try {
    const {
      patronType = 'Student',
      studentId,
      employeeId,
      visitDate,
      symptoms,
      diagnosis,
      treatmentGiven,
      medicinesAdministered = [],
      temperatureCelsius,
      bloodPressure,
      parentNotified = false,
      referredToHospital = false,
      status = 'Discharged',
    } = req.body;

    if (!symptoms || !treatmentGiven) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms and treatmentGiven are required fields',
      });
    }

    if (patronType === 'Student' && (!studentId || !mongoose.Types.ObjectId.isValid(studentId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid student ID is required for student infirmary visit',
      });
    }

    if (patronType === 'Staff' && (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid employee ID is required for staff clinic visit',
      });
    }

    // Check allergy warnings if student visit
    let allergyAlerts = [];
    if (patronType === 'Student' && studentId) {
      const studentRec = await MedicalRecord.findOne({ studentId });
      if (studentRec?.allergies?.length) {
        allergyAlerts = studentRec.allergies;
      }
    }

    // Decrement inventory for administered medicines if matching inventory items exist
    if (Array.isArray(medicinesAdministered) && medicinesAdministered.length > 0) {
      for (const item of medicinesAdministered) {
        if (item.medicineName && item.quantity > 0) {
          await MedicineInventory.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${item.medicineName.trim()}$`, 'i') } },
            { $inc: { quantityAvailable: -item.quantity } }
          );
        }
      }
    }

    const visit = await MedicalVisit.create({
      visitNumber: generateVisitNumber(),
      patronType,
      studentId: patronType === 'Student' ? studentId : null,
      employeeId: patronType === 'Staff' ? employeeId : null,
      visitDate: visitDate || new Date(),
      symptoms,
      diagnosis,
      treatmentGiven,
      medicinesAdministered,
      temperatureCelsius,
      bloodPressure,
      nurseInCharge: req.user?._id || new mongoose.Types.ObjectId(),
      parentNotified,
      referredToHospital,
      status,
    });

    const populatedVisit = await MedicalVisit.findById(visit._id)
      .populate('studentId', 'admissionNumber firstName lastName classId sectionId emergencyContact')
      .populate('employeeId', 'employeeId firstName lastName')
      .populate('nurseInCharge', 'username firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Clinic visit recorded successfully',
      data: populatedVisit,
      allergyAlerts,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedicalVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, parentNotified, referredToHospital, diagnosis, treatmentGiven } = req.body;

    if (!['Under Observation', 'Discharged', 'Referred Out'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Under Observation, Discharged, or Referred Out',
      });
    }

    const updateData = { status };
    if (parentNotified !== undefined) updateData.parentNotified = parentNotified;
    if (referredToHospital !== undefined) updateData.referredToHospital = referredToHospital;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (treatmentGiven) updateData.treatmentGiven = treatmentGiven;

    const visit = await MedicalVisit.findByIdAndUpdate(id, updateData, { new: true })
      .populate('studentId', 'admissionNumber firstName lastName emergencyContact')
      .populate('nurseInCharge', 'username firstName lastName');

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Medical visit not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Visit status updated successfully',
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. MEDICINE & SUPPLY INVENTORY
// ==========================================

export const getMedicineInventory = async (req, res, next) => {
  try {
    const { category, lowStockOnly } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    let items = await MedicineInventory.find(query).sort({ name: 1 });

    if (lowStockOnly === 'true') {
      items = items.filter((item) => item.quantityAvailable <= item.lowStockThreshold);
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const stats = {
      totalItems: items.length,
      lowStockCount: items.filter((i) => i.quantityAvailable <= i.lowStockThreshold).length,
      expiringSoonCount: items.filter((i) => i.expiryDate && new Date(i.expiryDate) <= thirtyDaysFromNow).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createMedicineItem = async (req, res, next) => {
  try {
    const {
      name,
      category = 'Other',
      quantityAvailable = 0,
      unit = 'Units',
      expiryDate,
      lowStockThreshold = 10,
      location = 'Infirmary Cabinet A',
    } = req.body;

    if (!name || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name and expiryDate are required',
      });
    }

    const existing = await MedicineInventory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Medicine item with this name already exists in inventory',
      });
    }

    const item = await MedicineInventory.create({
      name: name.trim(),
      category,
      quantityAvailable: Number(quantityAvailable),
      unit,
      expiryDate: new Date(expiryDate),
      lowStockThreshold: Number(lowStockThreshold),
      location,
    });

    return res.status(201).json({
      success: true,
      message: 'Medicine added to inventory',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedicineItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantityAvailable, lowStockThreshold, location, expiryDate, category } = req.body;

    const item = await MedicineInventory.findByIdAndUpdate(
      id,
      {
        ...(quantityAvailable !== undefined && { quantityAvailable: Number(quantityAvailable) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(location && { location }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(category && { category }),
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Medicine item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Medicine item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};
