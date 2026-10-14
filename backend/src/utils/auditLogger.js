import AuditLog from '../models/AuditLog.js';

/**
 * Asynchronously record an immutable security audit event.
 * Will not throw errors or disrupt client execution if logging fails.
 */
export const logAudit = async ({
  req,
  actor,
  action,
  resource,
  resourceId = null,
  description = null,
  diff = null,
  details = null,
  status = 'SUCCESS',
  failureReason = null,
}) => {
  try {
    const actorUser = actor || req?.user;
    const actorId = actorUser?._id || null;
    const actorName =
      (actorUser ? `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() : '') ||
      actorUser?.username ||
      'System / Guest';
    const actorEmail = actorUser?.email || '';
    const actorRole = actorUser?.role?.name || (actorUser?.role ? String(actorUser.role) : 'SYSTEM');

    if (!action || !resource) {
      return null;
    }

    const ipAddress =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '127.0.0.1';

    const userAgent = req?.headers?.['user-agent'] || 'Internal';

    const logEntry = await AuditLog.create({
      actorId,
      actorName,
      actorEmail,
      actorRole,
      action: String(action).toUpperCase(),
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      description: description || `${actorName} performed ${action} on ${resource}`,
      ipAddress,
      userAgent,
      diff,
      details,
      status,
      failureReason,
    });

    return logEntry;
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err.message);
    return null;
  }
};

export default logAudit;
