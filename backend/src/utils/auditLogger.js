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
  diff = null,
  status = 'SUCCESS',
  failureReason = null,
}) => {
  try {
    const actorId = actor?._id || req?.user?._id;
    const actorName =
      actor?.username ||
      (req?.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username : 'System');
    const actorRole = actor?.role?.name || req?.user?.role?.name || 'SYSTEM';

    if (!actorId || !action || !resource) {
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
      actorRole,
      action,
      resource,
      resourceId,
      ipAddress,
      userAgent,
      diff,
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
