import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

export const auditMiddleware = (resourceName) => {
  return async (req, res, next) => {
    // Only intercept state-mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;
      res.send(data);

      // Asynchronously log audit entry after response is initiated
      (async () => {
        try {
          if (req.user && res.statusCode < 400) {
            const action = `${req.method}_${resourceName.toUpperCase()}`;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'] || 'Unknown';

            await AuditLog.create({
              actorId: req.user._id,
              actorName: req.user.username,
              actorRole: req.user.role?.name || 'UNKNOWN',
              action,
              resource: resourceName,
              resourceId: req.params.id || null,
              ipAddress,
              userAgent,
              status: 'SUCCESS',
            });
          }
        } catch (auditErr) {
          logger.error('Failed to write audit log entry:', auditErr.message);
        }
      })();
    };

    next();
  };
};

export default auditMiddleware;
