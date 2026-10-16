import mongoose from 'mongoose';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import connectDB, { disconnectDB } from '../config/db.js';
import ENV from '../config/env.js';

export const PERMISSIONS_DATA = [
  // Students
  { resource: 'students', action: 'view', description: 'View student profiles' },
  { resource: 'students', action: 'create', description: 'Create new student' },
  { resource: 'students', action: 'update', description: 'Update student record' },
  { resource: 'students', action: 'delete', description: 'Delete or archive student' },
  { resource: 'students', action: 'export', description: 'Export student lists' },
  { resource: 'students', action: 'print', description: 'Print student profiles' },

  // Academic Setup
  { resource: 'academics', action: 'view', description: 'View academic setup' },
  { resource: 'academics', action: 'create', description: 'Create classes and subjects' },
  { resource: 'academics', action: 'update', description: 'Update classes and subjects' },
  { resource: 'academics', action: 'delete', description: 'Delete classes or subjects' },

  // Attendance
  { resource: 'attendance', action: 'view', description: 'View attendance registers' },
  { resource: 'attendance', action: 'create', description: 'Record daily attendance' },
  { resource: 'attendance', action: 'update', description: 'Modify attendance entries' },
  { resource: 'attendance', action: 'export', description: 'Export attendance statistics' },

  // Timetable
  { resource: 'timetable', action: 'view', description: 'View timetables' },
  { resource: 'timetable', action: 'create', description: 'Schedule timetable periods' },
  { resource: 'timetable', action: 'update', description: 'Modify timetable allocations' },
  { resource: 'timetable', action: 'delete', description: 'Remove timetable periods' },

  // Homework
  { resource: 'homework', action: 'view', description: 'View assigned homework' },
  { resource: 'homework', action: 'create', description: 'Assign homework' },
  { resource: 'homework', action: 'update', description: 'Grade and edit homework' },
  { resource: 'homework', action: 'delete', description: 'Delete homework tasks' },

  // Examination & Marks
  { resource: 'exams', action: 'view', description: 'View exam schedules and marks' },
  { resource: 'exams', action: 'create', description: 'Create exams and enter marks' },
  { resource: 'exams', action: 'update', description: 'Update marks and report cards' },
  { resource: 'exams', action: 'approve', description: 'Publish report cards' },
  { resource: 'exams', action: 'export', description: 'Export grade reports' },

  // Fees & Finance
  { resource: 'fees', action: 'view', description: 'View fee ledgers and reports' },
  { resource: 'fees', action: 'create', description: 'Collect fees and create fee structures' },
  { resource: 'fees', action: 'update', description: 'Apply discounts and edit fee structures' },
  { resource: 'fees', action: 'approve', description: 'Approve refunds and fee waivers' },
  { resource: 'fees', action: 'export', description: 'Export fee collection reports' },
  { resource: 'fees', action: 'print', description: 'Print receipts and invoices' },

  // Admissions
  { resource: 'admissions', action: 'view', description: 'View inquiries and applications' },
  { resource: 'admissions', action: 'create', description: 'Create applications and record inquiries' },
  { resource: 'admissions', action: 'update', description: 'Update entrance marks and review applications' },
  { resource: 'admissions', action: 'approve', description: 'Approve admission and convert to student' },

  // Staff & HR
  { resource: 'staff', action: 'view', description: 'View employee directory' },
  { resource: 'staff', action: 'create', description: 'Hire and add employees' },
  { resource: 'staff', action: 'update', description: 'Update employee records' },
  { resource: 'staff', action: 'delete', description: 'Terminate or archive staff' },
  { resource: 'staff', action: 'export', description: 'Export staff rosters' },

  // Payroll
  { resource: 'payroll', action: 'view', description: 'View payroll records' },
  { resource: 'payroll', action: 'create', description: 'Process monthly payroll' },
  { resource: 'payroll', action: 'update', description: 'Update salary structures' },
  { resource: 'payroll', action: 'approve', description: 'Disburse payroll' },

  // Library
  { resource: 'library', action: 'view', description: 'Search and view library books' },
  { resource: 'library', action: 'create', description: 'Add books and issue loans' },
  { resource: 'library', action: 'update', description: 'Return books and assess fines' },
  { resource: 'library', action: 'delete', description: 'Write off lost or damaged books' },

  // Transport
  { resource: 'transport', action: 'view', description: 'View vehicles, routes, and allocations' },
  { resource: 'transport', action: 'create', description: 'Add routes and assign students' },
  { resource: 'transport', action: 'update', description: 'Update route stops and maintenance' },
  { resource: 'transport', action: 'delete', description: 'Remove routes or allocations' },

  // Medical
  { resource: 'medical', action: 'view', description: 'View student medical records and clinic logs' },
  { resource: 'medical', action: 'create', description: 'Record clinic visits and first aid' },
  { resource: 'medical', action: 'update', description: 'Update health history and medicine stock' },

  // IT
  { resource: 'it', action: 'view', description: 'View IT assets and helpdesk tickets' },
  { resource: 'it', action: 'create', description: 'Raise tickets and register assets' },
  { resource: 'it', action: 'update', description: 'Resolve tickets and update asset maintenance' },

  // Housekeeping
  { resource: 'housekeeping', action: 'view', description: 'View cleaning rosters and tasks' },
  { resource: 'housekeeping', action: 'create', description: 'Assign housekeeping tasks' },
  { resource: 'housekeeping', action: 'update', description: 'Complete and verify sanitation checklists' },

  // Security
  { resource: 'security', action: 'view', description: 'View visitor and incident logs' },
  { resource: 'security', action: 'create', description: 'Issue visitor passes and gate passes' },
  { resource: 'security', action: 'update', description: 'Check out visitors and resolve incidents' },

  // Canteen
  { resource: 'canteen', action: 'view', description: 'View food menu and inventory' },
  { resource: 'canteen', action: 'create', description: 'Record cafeteria POS sales' },
  { resource: 'canteen', action: 'update', description: 'Update prices and stock levels' },

  // Audit Logs
  { resource: 'audit', action: 'view', description: 'View system security audit trail' },
  { resource: 'audit', action: 'export', description: 'Export audit logs' },

  // RBAC Roles Management
  { resource: 'roles', action: 'view', description: 'View system roles' },
  { resource: 'roles', action: 'create', description: 'Create custom roles' },
  { resource: 'roles', action: 'update', description: 'Assign permissions to roles' },

  // Enterprise Module 2: Communication & PTM
  { resource: 'communication', action: 'view', description: 'View communications, logs, and PTM slots' },
  { resource: 'communication', action: 'broadcast', description: 'Broadcast SMS and WhatsApp announcements' },
  { resource: 'communication', action: 'ptm', description: 'Schedule and manage parent-teacher meetings' },
  { resource: 'communication', action: 'chat', description: 'Send and receive real-time messages' },

  // Enterprise Module 4: LMS & E-Learning
  { resource: 'lms', action: 'view', description: 'Access learning materials and quiz portals' },
  { resource: 'lms', action: 'create', description: 'Create assessments, quizzes, and upload study material' },
  { resource: 'lms', action: 'grade', description: 'Grade student assignment submissions and assessments' },
  { resource: 'lms', action: 'manage', description: 'Delete study materials and manage LMS course settings' },

  // Enterprise Module 5: Fleet GPS & Bus Tracking
  { resource: 'tracking', action: 'view', description: 'View live bus fleet tracking and GPS map' },
  { resource: 'tracking', action: 'telemetry', description: 'Update bus GPS telemetry and trigger emergency SOS' },
  { resource: 'tracking', action: 'boarding', description: 'Check in and manage student bus boarding status' },

  // Enterprise Module 6: Certificates & ID Cards
  { resource: 'certificates', action: 'view', description: 'View certificates and student ID cards' },
  { resource: 'certificates', action: 'create', description: 'Generate certificates, ID cards, and hall tickets' },
  { resource: 'certificates', action: 'verify', description: 'Verify official school certificate credentials' },
  { resource: 'certificates', action: 'print', description: 'Print and export certificates and ID cards' },

  // Enterprise Module 7: AI & Predictive Analytics
  { resource: 'analytics', action: 'view', description: 'View AI predictive student retention and academic risk reports' },
  { resource: 'analytics', action: 'copilot', description: 'Access AI Copilot (lesson planner, quiz maker, remark assistant)' },

  // Campus Notices & Circulars
  { resource: 'notices', action: 'view', description: 'View campus circulars and official announcements' },
  { resource: 'notices', action: 'create', description: 'Publish new campus notices and circulars' },
  { resource: 'notices', action: 'update', description: 'Edit notices, change target audience, or pin announcements' },
  { resource: 'notices', action: 'delete', description: 'Retract or delete circulars' },

  // Dedicated Self-Service Portals
  { resource: 'portal', action: 'student', description: 'Access student self-service portal (timetable, homework, marks)' },
  { resource: 'portal', action: 'parent', description: 'Access parent portal (multi-child academic records, fees)' },
];

export const seedRBAC = async () => {
  console.log('[Seed] Starting RBAC Seeding...');

  // 1. Seed Permissions
  const permissionMap = new Map();

  for (const item of PERMISSIONS_DATA) {
    const code = `${item.resource}:${item.action}`;
    const permission = await Permission.findOneAndUpdate(
      { code },
      {
        resource: item.resource,
        action: item.action,
        code,
        description: item.description,
        category: item.resource.toUpperCase(),
      },
      { upsert: true, new: true }
    );
    permissionMap.set(code, permission._id);
  }
  console.log(`[Seed] Seeded ${permissionMap.size} permissions.`);

  // Helper to extract IDs from codes
  const getPermIds = (codes) => codes.map((c) => permissionMap.get(c)).filter(Boolean);

  // 2. Define standard 16 roles with permission mappings
  const allPermissionIds = Array.from(permissionMap.values());

  const rolesConfig = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'Root system administrator with global unrestricted access.',
      hierarchyLevel: 0,
      isSystem: true,
      permissions: allPermissionIds,
    },
    {
      name: 'PRINCIPAL',
      displayName: 'School Principal',
      description: 'Executive academic and operational oversight across all departments.',
      hierarchyLevel: 1,
      isSystem: true,
      permissions: allPermissionIds,
    },
    {
      name: 'ADMINISTRATOR',
      displayName: 'School Administrator',
      description: 'Day-to-day administrative operations manager.',
      hierarchyLevel: 2,
      isSystem: true,
      permissions: getPermIds([
        'students:view', 'students:create', 'students:update', 'students:export', 'students:print',
        'academics:view', 'academics:create', 'academics:update',
        'attendance:view', 'attendance:export',
        'timetable:view', 'timetable:create', 'timetable:update',
        'homework:view',
        'exams:view', 'exams:approve',
        'fees:view', 'fees:export', 'fees:print',
        'admissions:view', 'admissions:create', 'admissions:update', 'admissions:approve',
        'staff:view', 'staff:create', 'staff:update', 'staff:export',
        'library:view', 'transport:view', 'medical:view', 'it:view',
        'housekeeping:view', 'security:view', 'canteen:view',
        'roles:view',
        'communication:view', 'communication:broadcast', 'communication:ptm', 'communication:chat',
        'lms:view', 'lms:create', 'lms:grade', 'lms:manage',
        'tracking:view', 'tracking:telemetry', 'tracking:boarding',
        'certificates:view', 'certificates:create', 'certificates:verify', 'certificates:print',
        'analytics:view', 'analytics:copilot',
      ]),
    },
    {
      name: 'TEACHER',
      displayName: 'Teacher / Faculty',
      description: 'Teaching staff managing attendance, homework, exams, and marks.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'students:view',
        'academics:view',
        'attendance:view', 'attendance:create', 'attendance:update',
        'timetable:view',
        'homework:view', 'homework:create', 'homework:update', 'homework:delete',
        'exams:view', 'exams:create', 'exams:update',
        'library:view',
        'it:create',
        'communication:view', 'communication:ptm', 'communication:chat',
        'lms:view', 'lms:create', 'lms:grade',
        'certificates:view', 'certificates:print',
        'analytics:view', 'analytics:copilot',
      ]),
    },
    {
      name: 'ACCOUNTANT',
      displayName: 'Accountant / Finance Manager',
      description: 'Manages student fee collections, receipts, expenses, and ledgers.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'students:view',
        'fees:view', 'fees:create', 'fees:update', 'fees:approve', 'fees:export', 'fees:print',
        'payroll:view', 'payroll:create', 'payroll:update',
      ]),
    },
    {
      name: 'ADMISSION_OFFICER',
      displayName: 'Admission Officer',
      description: 'Manages applicant inquiries, applications, entrance tests, and student enrollment.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'admissions:view', 'admissions:create', 'admissions:update', 'admissions:approve',
        'students:view', 'students:create',
        'communication:view', 'communication:broadcast',
        'certificates:view',
      ]),
    },
    {
      name: 'HR_STAFF_MANAGER',
      displayName: 'HR & Staff Manager',
      description: 'Manages employee directory, staff attendance, leave requests, and payroll.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'staff:view', 'staff:create', 'staff:update', 'staff:delete', 'staff:export',
        'payroll:view', 'payroll:create', 'payroll:update', 'payroll:approve',
        'attendance:view', 'attendance:create', 'attendance:update',
      ]),
    },
    {
      name: 'LIBRARIAN',
      displayName: 'Head Librarian',
      description: 'Manages library catalog, book inventory, loans, and fines.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'library:view', 'library:create', 'library:update', 'library:delete',
        'students:view', 'staff:view',
      ]),
    },
    {
      name: 'TRANSPORT_MANAGER',
      displayName: 'Transport Logistics Manager',
      description: 'Manages bus fleet, routes, stops, and student transport allocations.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'transport:view', 'transport:create', 'transport:update', 'transport:delete',
        'students:view',
        'tracking:view', 'tracking:telemetry', 'tracking:boarding',
        'communication:view', 'communication:chat',
      ]),
    },
    {
      name: 'MEDICAL_NURSE',
      displayName: 'School Nurse / Medical Officer',
      description: 'Maintains student health records, allergies, infirmary visits, and clinic inventory.',
      hierarchyLevel: 5,
      isSystem: true,
      permissions: getPermIds([
        'medical:view', 'medical:create', 'medical:update',
        'students:view',
      ]),
    },
    {
      name: 'IT_ADMINISTRATOR',
      displayName: 'IT Support Administrator',
      description: 'Manages IT hardware, software licenses, networks, and technical helpdesk tickets.',
      hierarchyLevel: 4,
      isSystem: true,
      permissions: getPermIds([
        'it:view', 'it:create', 'it:update', 'it:delete',
        'staff:view',
      ]),
    },
    {
      name: 'HOUSEKEEPING_MANAGER',
      displayName: 'Housekeeping & Facilities Supervisor',
      description: 'Manages cleaning schedules, area checklists, and janitorial supplies.',
      hierarchyLevel: 6,
      isSystem: true,
      permissions: getPermIds([
        'housekeeping:view', 'housekeeping:create', 'housekeeping:update', 'housekeeping:delete',
      ]),
    },
    {
      name: 'SECURITY_OFFICER',
      displayName: 'Campus Security Officer',
      description: 'Manages gate entry/exit, visitor passes, student early pickup, and security incidents.',
      hierarchyLevel: 6,
      isSystem: true,
      permissions: getPermIds([
        'security:view', 'security:create', 'security:update', 'security:delete',
        'students:view',
      ]),
    },
    {
      name: 'CANTEEN_MANAGER',
      displayName: 'Canteen & Cafeteria Manager',
      description: 'Manages food menu, inventory, and point-of-sale food transactions.',
      hierarchyLevel: 6,
      isSystem: true,
      permissions: getPermIds([
        'canteen:view', 'canteen:create', 'canteen:update', 'canteen:delete',
        'students:view', 'staff:view',
      ]),
    },
    {
      name: 'PARENT',
      displayName: 'Parent / Guardian',
      description: 'Guardian access to enrolled children records, attendance, fees, and report cards.',
      hierarchyLevel: 8,
      isSystem: true,
      permissions: getPermIds([
        'students:view', 'academics:view', 'attendance:view', 'homework:view',
        'exams:view', 'fees:view', 'fees:print', 'transport:view', 'medical:view',
        'communication:view', 'communication:ptm', 'communication:chat',
        'tracking:view',
        'certificates:view', 'certificates:print',
        'lms:view',
      ]),
    },
    {
      name: 'STUDENT',
      displayName: 'Enrolled Student',
      description: 'Student portal access for timetable, homework submissions, and marks.',
      hierarchyLevel: 9,
      isSystem: true,
      permissions: getPermIds([
        'academics:view', 'attendance:view', 'timetable:view',
        'homework:view', 'exams:view', 'library:view',
        'lms:view',
        'certificates:view', 'certificates:print',
        'communication:view', 'communication:chat',
        'tracking:view',
      ]),
    },
  ];

  for (const roleDef of rolesConfig) {
    await Role.findOneAndUpdate(
      { name: roleDef.name },
      roleDef,
      { upsert: true, new: true }
    );
  }
  console.log(`[Seed] Seeded ${rolesConfig.length} standard roles.`);

  // 3. Seed Default Super Admin User
  const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
  const existingAdmin = await User.findOne({ username: ENV.SUPER_ADMIN.USERNAME });

  if (!existingAdmin) {
    const adminUser = new User({
      username: ENV.SUPER_ADMIN.USERNAME,
      email: ENV.SUPER_ADMIN.EMAIL,
      password: ENV.SUPER_ADMIN.PASSWORD,
      role: superAdminRole._id,
      isActive: true,
    });
    await adminUser.save();
    console.log(`[Seed] Initial Super Admin user created: '${ENV.SUPER_ADMIN.USERNAME}'`);
  } else {
    existingAdmin.role = superAdminRole._id;
    existingAdmin.isActive = true;
    await existingAdmin.save();
    console.log(`[Seed] Super Admin user verified: '${ENV.SUPER_ADMIN.USERNAME}'`);
  }

  console.log('[Seed] RBAC Seeding Completed Successfully!');
};

// If run directly from terminal
if (process.argv[1]?.endsWith('seedRbac.js')) {
  (async () => {
    try {
      await connectDB();
      await seedRBAC();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    }
  })();
}

export default seedRBAC;
