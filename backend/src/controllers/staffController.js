import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import StaffLeave from '../models/StaffLeave.js';
import Payroll from '../models/Payroll.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

// Helper for unique employee identifiers
const generateEmployeeId = async () => {
  const year = new Date().getFullYear();
  const count = await Employee.countDocuments();
  return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Helper for unique payslip serial
const generatePayslipNumber = (year, month, employeeId) => {
  return `PS-${year}${String(month).padStart(2, '0')}-${employeeId}`;
};

// ==========================================
// 1. DEPARTMENTS & DESIGNATIONS
// ==========================================

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required' });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || '',
    });

    res.status(201).json({ success: true, data: dept, message: 'Department created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDesignations = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const filter = { isActive: true };
    if (departmentId) filter.departmentId = departmentId;

    const designations = await Designation.find(filter)
      .populate('departmentId', 'name code')
      .sort({ title: 1 });

    res.status(200).json({ success: true, count: designations.length, data: designations });
  } catch (error) {
    next(error);
  }
};

export const createDesignation = async (req, res, next) => {
  try {
    const { title, code, departmentId, description } = req.body;
    if (!title || !departmentId) {
      return res.status(400).json({ success: false, message: 'Title and departmentId are required' });
    }

    const designation = await Designation.create({
      title: title.trim(),
      code: (code || title.slice(0, 4)).trim().toUpperCase(),
      departmentId,
      description: description?.trim() || '',
    });

    const populated = await Designation.findById(designation._id).populate('departmentId', 'name code');

    res.status(201).json({ success: true, data: populated, message: 'Designation created successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. EMPLOYEES DIRECTORY
// ==========================================

export const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      age,
      departmentId,
      designationId,
      basicSalary = 3000,
      allowances = [],
      deductions = [],
      employmentType = 'Full-Time',
      dateOfJoining,
      bankDetails,
      createLogin = true,
      customUsername,
      customPassword,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !gender || !departmentId || !designationId) {
      return res.status(400).json({
        success: false,
        message: 'firstName, lastName, email, phone, gender, departmentId, and designationId are required',
      });
    }

    const employeeId = await generateEmployeeId();

    let calcAge = age !== undefined && age !== null && age !== '' ? Number(age) : null;
    let dob = dateOfBirth ? new Date(dateOfBirth) : null;
    if (dob && calcAge === null) {
      const today = new Date();
      calcAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        calcAge--;
      }
    } else if (calcAge !== null && !dob) {
      const approxYear = new Date().getFullYear() - calcAge;
      dob = new Date(`${approxYear}-01-01`);
    }

    const employee = await Employee.create({
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      gender,
      dateOfBirth: dob,
      age: calcAge,
      departmentId,
      designationId,
      employmentType,
      joiningDate: dateOfJoining ? new Date(dateOfJoining) : new Date(),
      salaryStructure: {
        basicSalary: Number(basicSalary) || 0,
        allowances: allowances || [],
        deductions: deductions || [],
      },
      bankDetails: bankDetails || {},
      status: 'Active',
    });

    // Auto-provision CRM User login credentials
    let loginCredentials = null;
    if (createLogin) {
      try {
        // Resolve role from designation / department
        const desig = await Designation.findById(designationId);
        const dept = await Department.findById(departmentId);
        const titleLower = (desig?.title || '').toLowerCase();
        const deptCode = (dept?.code || '').toUpperCase();

        let targetRoleName = 'TEACHER';
        if (titleLower.includes('account') || titleLower.includes('finance') || deptCode === 'FIN') {
          targetRoleName = 'ACCOUNTANT';
        } else if (titleLower.includes('librar') || deptCode === 'LIB') {
          targetRoleName = 'LIBRARIAN';
        } else if (titleLower.includes('transport') || titleLower.includes('driver') || deptCode === 'TRANS') {
          targetRoleName = 'TRANSPORT_MANAGER';
        } else if (titleLower.includes('nurse') || titleLower.includes('medic') || deptCode === 'MED') {
          targetRoleName = 'MEDICAL_NURSE';
        } else if (titleLower.includes('clean') || titleLower.includes('housekeep') || deptCode === 'FAC') {
          targetRoleName = 'HOUSEKEEPING_MANAGER';
        } else if (titleLower.includes('security') || titleLower.includes('guard') || deptCode === 'SEC') {
          targetRoleName = 'SECURITY_OFFICER';
        } else if (titleLower.includes('canteen') || deptCode === 'CAN') {
          targetRoleName = 'CANTEEN_MANAGER';
        }

        const role = await Role.findOne({ name: targetRoleName }) || await Role.findOne({ name: 'TEACHER' });

        // Generate username
        let baseUsername = customUsername?.trim().toLowerCase() || firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (baseUsername.length < 3) baseUsername = `${baseUsername}emp`;
        let finalUsername = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username: finalUsername })) {
          finalUsername = `${baseUsername}${suffix}`;
          suffix += 1;
        }

        const finalPassword = customPassword?.trim() || `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()}@12345`;

        const newUser = new User({
          username: finalUsername,
          email: email.trim().toLowerCase(),
          password: finalPassword,
          role: role._id,
          employeeId: employee._id,
          isActive: true,
        });
        await newUser.save();

        employee.userId = newUser._id;
        await employee.save();

        loginCredentials = {
          username: finalUsername,
          email: email.trim().toLowerCase(),
          initialPassword: finalPassword,
          role: role.name,
        };
      } catch (userErr) {
        console.warn('[Staff] User provisioning warning:', userErr.message);
      }
    }

    const populated = await Employee.findById(employee._id)
      .populate('departmentId', 'name code')
      .populate('designationId', 'title code')
      .populate('userId', 'username email isActive');

    const credsMsg = loginCredentials
      ? ` | Login ID: "${loginCredentials.username}" (or email "${loginCredentials.email}"), Password: "${loginCredentials.initialPassword}"`
      : '';

    res.status(201).json({
      success: true,
      data: populated,
      loginCredentials,
      message: `Employee (${employee.employeeId}) registered successfully!${credsMsg}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const { departmentId, designationId, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (departmentId) filter.departmentId = departmentId;
    if (designationId) filter.designationId = designationId;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('departmentId', 'name code')
        .populate('designationId', 'title code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id)
      .populate('departmentId')
      .populate('designationId');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update Name
    if (updates.firstName !== undefined) employee.firstName = updates.firstName.trim();
    if (updates.lastName !== undefined) employee.lastName = updates.lastName.trim();

    // Update Mobile No / Phone
    if (updates.phone !== undefined) employee.phone = updates.phone.trim();

    // Update Email
    if (updates.email !== undefined) {
      const newEmail = updates.email.trim().toLowerCase();
      if (newEmail !== employee.email) {
        const existing = await Employee.findOne({ email: newEmail, _id: { $ne: employee._id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email address is already in use by another staff member' });
        }
        employee.email = newEmail;
      }
    }

    // Update Gender
    if (updates.gender !== undefined) employee.gender = updates.gender;

    // Update Age and Date of Birth
    if (updates.dateOfBirth) {
      const dob = new Date(updates.dateOfBirth);
      employee.dateOfBirth = dob;
      if (updates.age !== undefined && updates.age !== null && updates.age !== '') {
        employee.age = Number(updates.age);
      } else {
        const today = new Date();
        let calcAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          calcAge--;
        }
        employee.age = calcAge;
      }
    } else if (updates.age !== undefined && updates.age !== null && updates.age !== '') {
      employee.age = Number(updates.age);
      if (!employee.dateOfBirth) {
        const approxYear = new Date().getFullYear() - Number(updates.age);
        employee.dateOfBirth = new Date(`${approxYear}-01-01`);
      }
    }

    // Update Department & Designation
    if (updates.departmentId !== undefined && updates.departmentId) {
      employee.departmentId = updates.departmentId;
    }
    if (updates.designationId !== undefined && updates.designationId) {
      employee.designationId = updates.designationId;
    }

    // Update Employment Type & Status
    if (updates.employmentType !== undefined) employee.employmentType = updates.employmentType;
    if (updates.status !== undefined) employee.status = updates.status;

    // Update Qualifications & Experience
    if (updates.qualification !== undefined) employee.qualification = updates.qualification?.trim();
    if (updates.experienceYears !== undefined) employee.experienceYears = Number(updates.experienceYears);

    // Update Basic Salary
    if (updates.basicSalary !== undefined) {
      if (!employee.salaryStructure) employee.salaryStructure = {};
      employee.salaryStructure.basicSalary = Number(updates.basicSalary);
    }

    // Update Address & Emergency Contact
    if (updates.address) {
      employee.address = {
        ...(employee.address?.toObject?.() || employee.address || {}),
        ...updates.address,
      };
    }
    if (updates.emergencyContact) {
      employee.emergencyContact = {
        ...(employee.emergencyContact?.toObject?.() || employee.emergencyContact || {}),
        ...updates.emergencyContact,
      };
    }

    await employee.save();

    // Sync linked user login account if applicable
    if (employee.userId) {
      try {
        const userUpdates = {};
        if (updates.email) userUpdates.email = employee.email;
        if (updates.status) {
          userUpdates.isActive = updates.status === 'Active' || updates.status === 'On Leave';
        }
        if (Object.keys(userUpdates).length > 0) {
          await User.findByIdAndUpdate(employee.userId, userUpdates);
        }
      } catch (userErr) {
        console.warn('[Staff] User sync warning during employee update:', userErr.message);
      }
    }

    const populated = await Employee.findById(employee._id)
      .populate('departmentId', 'name code')
      .populate('designationId', 'title code')
      .populate('userId', 'username email isActive');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Employee record updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. STAFF LEAVES
// ==========================================

export const submitLeaveRequest = async (req, res, next) => {
  try {
    const { employeeId, leaveType, startDate, endDate, totalDays, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, leaveType, startDate, endDate, and reason are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const calculatedDays =
      totalDays || Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const leave = await StaffLeave.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: calculatedDays,
      reason: reason.trim(),
      status: 'Pending',
    });

    const populated = await StaffLeave.findById(leave._id).populate({
      path: 'employeeId',
      select: 'firstName lastName employeeId departmentId',
      populate: { path: 'departmentId', select: 'name' },
    });

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Leave request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequests = async (req, res, next) => {
  try {
    const { employeeId, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [leaves, total] = await Promise.all([
      StaffLeave.find(filter)
        .populate({
          path: 'employeeId',
          select: 'firstName lastName employeeId departmentId designationId',
          populate: [
            { path: 'departmentId', select: 'name code' },
            { path: 'designationId', select: 'title' },
          ],
        })
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StaffLeave.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: leaves.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewRemarks } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected' });
    }

    const leave = await StaffLeave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.reviewRemarks = reviewRemarks?.trim() || null;
    leave.reviewedAt = new Date();
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave,
      message: `Leave request has been ${status.toLowerCase()}`,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. PAYROLL ENGINE
// ==========================================

export const generatePayroll = async (req, res, next) => {
  try {
    const { month, year, departmentId, employeeId } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month (1-12) and year are required' });
    }

    let employees = [];
    if (employeeId) {
      const single = await Employee.findById(employeeId);
      if (!single) return res.status(404).json({ success: false, message: 'Employee not found' });
      employees = [single];
    } else {
      const filter = { status: 'Active' };
      if (departmentId) filter.departmentId = departmentId;
      employees = await Employee.find(filter);
    }

    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No active employees found to generate payroll' });
    }

    const generated = [];
    let skipped = 0;

    for (const emp of employees) {
      const existing = await Payroll.findOne({
        employeeId: emp._id,
        month: Number(month),
        year: Number(year),
      });

      if (existing) {
        skipped++;
        continue;
      }

      const basicSalary = emp.salaryStructure?.basicSalary || emp.basicSalary || 3000;
      const allowances = emp.salaryStructure?.allowances && emp.salaryStructure.allowances.length > 0
        ? emp.salaryStructure.allowances
        : [
            { name: 'House Rent Allowance (HRA)', amount: Math.round(basicSalary * 0.2) },
            { name: 'Transport Allowance', amount: 150 },
          ];
      const deductions = emp.salaryStructure?.deductions && emp.salaryStructure.deductions.length > 0
        ? emp.salaryStructure.deductions
        : [
            { name: 'Provident Fund (PF)', amount: Math.round(basicSalary * 0.1) },
            { name: 'Professional Tax', amount: 50 },
          ];

      const totalAllowances = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const netSalary = Math.max(0, basicSalary + totalAllowances - totalDeductions);
      const payslipNumber = generatePayslipNumber(year, month, emp.employeeId);

      const payrollRecord = await Payroll.create({
        employeeId: emp._id,
        month: Number(month),
        year: Number(year),
        basicSalary,
        totalAllowances,
        allowanceBreakdown: allowances,
        totalDeductions,
        deductionBreakdown: deductions,
        netSalary,
        status: 'Processed',
        paymentMethod: 'Bank Transfer',
        payslipNumber,
      });

      generated.push(payrollRecord);
    }

    res.status(201).json({
      success: true,
      count: generated.length,
      skipped,
      data: generated,
      message: `Generated ${generated.length} monthly payroll slips (${skipped} already existed).`,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrolls = async (req, res, next) => {
  try {
    const { month, year, status, employeeId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const skip = (Number(page) - 1) * Number(limit);

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate({
          path: 'employeeId',
          select: 'firstName lastName employeeId email phone departmentId designationId bankDetails',
          populate: [
            { path: 'departmentId', select: 'name code' },
            { path: 'designationId', select: 'title' },
          ],
        })
        .sort({ year: -1, month: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payroll.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayrollStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod = 'Bank Transfer', transactionReference, remarks } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (status) payroll.status = status;
    if (status === 'Paid') {
      payroll.paymentDate = new Date();
      payroll.paymentMethod = paymentMethod;
      payroll.transactionReference = transactionReference?.trim() || `TXN-PAY-${Date.now().toString().slice(-6)}`;
    }
    if (remarks) payroll.remarks = remarks.trim();

    await payroll.save();

    res.status(200).json({
      success: true,
      data: payroll,
      message: `Payroll status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
