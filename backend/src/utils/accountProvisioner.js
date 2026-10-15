import User from '../models/User.js';
import Role from '../models/Role.js';

export const getCleanFirstWord = (name, fallback = 'user') => {
  if (!name) return fallback;
  const word = String(name).trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '');
  return word.length >= 2 ? word : fallback;
};

export const generateNameCredentials = (rawName, fallbackPrefix = 'user') => {
  const cleanWord = getCleanFirstWord(rawName, fallbackPrefix);
  const baseUsername = cleanWord.toLowerCase();
  const capWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
  const password = `${capWord}@12345`;
  return { baseUsername, password };
};

/**
 * Automatically provisions and synchronizes login accounts (User records)
 * for an enrolled student and their parent / father profile.
 *
 * Rules:
 * Student username = firstName lowercase (e.g. 'ravi')
 * Student password = FirstName@12345 (e.g. 'Ravi@12345')
 * Father username = fatherFirstName lowercase (e.g. 'rajesh')
 * Father password = FatherFirstName@12345 (e.g. 'Rajesh@12345')
 */
export const provisionStudentAndParentAccounts = async ({
  student,
  parent,
  studentEmail,
  parentEmail,
}) => {
  // Ensure STUDENT and PARENT roles exist in RBAC
  let [studentRole, parentRole] = await Promise.all([
    Role.findOne({ name: 'STUDENT' }),
    Role.findOne({ name: 'PARENT' }),
  ]);

  if (!studentRole) {
    studentRole = await Role.create({
      name: 'STUDENT',
      displayName: 'Enrolled Student',
      description: 'Student portal access for timetable, homework, and marks.',
      hierarchyLevel: 9,
      isSystem: true,
    });
  }

  if (!parentRole) {
    parentRole = await Role.create({
      name: 'PARENT',
      displayName: 'Parent / Guardian',
      description: 'Guardian access to enrolled children records, fees, and report cards.',
      hierarchyLevel: 8,
      isSystem: true,
    });
  }

  const result = {
    studentUser: null,
    parentUser: null,
    studentCredentials: null,
    parentCredentials: null,
  };

  // 1. Provision Student User Account
  if (student?._id) {
    let existingStudentUser = await User.findOne({ studentId: student._id });
    const { baseUsername, password } = generateNameCredentials(
      student.firstName || student.name,
      student.studentId?.toLowerCase() || 'student'
    );

    if (!existingStudentUser) {
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.exists({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter++}`;
      }

      let validEmail = undefined;
      const rawEmail = studentEmail || student.contact?.email;
      if (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) {
        const cleanEmail = rawEmail.trim().toLowerCase();
        const taken = await User.exists({ email: cleanEmail });
        if (!taken) validEmail = cleanEmail;
      }

      const newUser = new User({
        username: uniqueUsername,
        email: validEmail,
        password: password,
        role: studentRole._id,
        studentId: student._id,
        isActive: true,
      });
      await newUser.save();

      result.studentUser = newUser;
      result.studentCredentials = {
        username: uniqueUsername,
        password: password,
        role: 'STUDENT',
        isNew: true,
      };
    } else {
      result.studentUser = existingStudentUser;
      result.studentCredentials = {
        username: existingStudentUser.username,
        password: password,
        role: 'STUDENT',
        isNew: false,
      };
    }
  }

  // 2. Provision Parent (Father / Guardian) User Account
  if (parent?._id) {
    let existingParentUser = await User.findOne({ parentId: parent._id });
    const fatherRawName = parent.fatherName || parent.primaryContactName || parent.name || 'parent';
    const { baseUsername, password } = generateNameCredentials(
      fatherRawName,
      parent.parentId?.toLowerCase() || 'parent'
    );

    if (!existingParentUser) {
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.exists({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter++}`;
      }

      let validEmail = undefined;
      const rawEmail = parentEmail || parent.fatherEmail || parent.email;
      if (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) {
        const cleanEmail = rawEmail.trim().toLowerCase();
        const taken = await User.exists({ email: cleanEmail });
        if (!taken) validEmail = cleanEmail;
      }

      const newUser = new User({
        username: uniqueUsername,
        email: validEmail,
        password: password,
        role: parentRole._id,
        parentId: parent._id,
        isActive: true,
      });
      await newUser.save();

      result.parentUser = newUser;
      result.parentCredentials = {
        username: uniqueUsername,
        password: password,
        role: 'PARENT',
        isNew: true,
      };
    } else {
      result.parentUser = existingParentUser;
      result.parentCredentials = {
        username: existingParentUser.username,
        password: password,
        role: 'PARENT',
        isNew: false,
      };
    }
  }

  return result;
};

export default provisionStudentAndParentAccounts;
