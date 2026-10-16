import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import { PERMISSIONS_DATA } from '../seeders/seedRbac.js';

export const syncAllPermissions = async () => {
  try {
    await connectDB();
    console.log('[RBAC Sync] Starting permissions synchronization...');

    const permissionIds = [];
    for (const item of PERMISSIONS_DATA) {
      const code = `${item.resource}:${item.action}`;
      const perm = await Permission.findOneAndUpdate(
        { code },
        {
          resource: item.resource,
          action: item.action,
          code,
          description: item.description,
          category: item.resource.toUpperCase(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      permissionIds.push(perm._id);
    }

    console.log(`[RBAC Sync] Successfully synchronized ${permissionIds.length} permissions.`);

    // Ensure SUPER_ADMIN has all permissions
    const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
    if (superAdminRole) {
      superAdminRole.permissions = permissionIds;
      await superAdminRole.save();
      console.log('[RBAC Sync] Attached all permissions to SUPER_ADMIN role.');
    }

    // Ensure STUDENT role has portal:student permission
    const studentRole = await Role.findOne({ name: 'STUDENT' });
    if (studentRole) {
      const studentPerms = await Permission.find({
        code: { $in: ['portal:student', 'notices:view', 'lms:view', 'timetable:view', 'homework:view'] },
      });
      studentRole.permissions = studentPerms.map((p) => p._id);
      await studentRole.save();
      console.log('[RBAC Sync] Attached student permissions to STUDENT role.');
    }

    // Ensure PARENT role has portal:parent permission
    const parentRole = await Role.findOne({ name: 'PARENT' });
    if (parentRole) {
      const parentPerms = await Permission.find({
        code: { $in: ['portal:parent', 'notices:view', 'fees:view', 'tracking:view', 'communication:view'] },
      });
      parentRole.permissions = parentPerms.map((p) => p._id);
      await parentRole.save();
      console.log('[RBAC Sync] Attached parent permissions to PARENT role.');
    }

    console.log('[RBAC Sync] Completed successfully.');
  } catch (err) {
    console.error('[RBAC Sync] Error syncing permissions:', err);
  } finally {
    await disconnectDB();
  }
};

if (process.argv[1] && process.argv[1].endsWith('syncPermissions.js')) {
  syncAllPermissions().then(() => process.exit(0));
}
