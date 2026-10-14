import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../utils/auditLogger.js';
import logger from '../utils/logger.js';

// Sensitive keys to mask from audit trail payloads
const SENSITIVE_KEYS = new Set([
  'password',
  'confirmPassword',
  'oldPassword',
  'newPassword',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
]);

export const sanitizePayload = (obj, depth = 0) => {
  if (depth > 5) return '[Nested]';
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizePayload(item, depth + 1));

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key) || key.toLowerCase().includes('password')) {
      clean[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizePayload(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

// Derive human-readable module and action name from URL & method
export const deriveActionFromReq = (req) => {
  const method = req.method;
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  
  // Skip /api prefix if present
  const segments = parts[0] === 'api' ? parts.slice(1) : parts;
  const domain = segments[0]?.toLowerCase() || 'system';

  let resource = 'System';
  let specificAction = '';

  switch (domain) {
    case 'students':
      resource = 'Student';
      if (url.includes('/status')) specificAction = 'CHANGE_STATUS';
      break;
    case 'academics':
      resource = 'Academics';
      if (url.includes('/marks')) {
        resource = 'ExamMarks';
        specificAction = 'RECORD_MARKS';
      } else if (url.includes('/homework')) {
        resource = 'Homework';
        if (method === 'DELETE') specificAction = 'DELETE_HOMEWORK';
        else if (method === 'PUT') specificAction = 'UPDATE_HOMEWORK';
        else if (method === 'POST') specificAction = 'ASSIGN_HOMEWORK';
      } else if (url.includes('/timetable')) {
        resource = 'Timetable';
        specificAction = 'UPDATE_SCHEDULE';
      } else if (url.includes('/attendance')) {
        resource = 'Attendance';
        specificAction = 'RECORD_ATTENDANCE';
      } else if (url.includes('/compile')) {
        resource = 'ClassResults';
        specificAction = 'COMPILE_RESULTS';
      } else if (url.includes('/report-card')) {
        resource = 'ReportCard';
        specificAction = 'UPDATE_REPORT_CARD';
      }
      break;
    case 'finance':
    case 'fees':
      resource = 'Finance';
      if (url.includes('/collect') || url.includes('/payments')) {
        resource = 'FeePayment';
        specificAction = 'COLLECT_FEE';
      } else if (url.includes('/invoice')) {
        resource = 'FeeInvoice';
      }
      break;
    case 'auth':
      resource = 'Auth';
      if (url.includes('/login')) specificAction = 'LOGIN';
      else if (url.includes('/logout')) specificAction = 'LOGOUT';
      else if (url.includes('/change-password') || url.includes('/reset-password')) specificAction = 'CHANGE_PASSWORD';
      break;
    case 'admin':
      resource = 'Admin';
      if (url.includes('/users')) resource = 'User';
      break;
    case 'staff':
      resource = 'Staff';
      break;
    case 'notices':
      resource = 'Notice';
      break;
    case 'admissions':
      resource = 'Admission';
      break;
    case 'rbac':
      resource = 'RBAC';
      break;
    case 'parents':
      resource = 'Parent';
      break;
    default:
      resource = domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  let verb = method;
  if (method === 'POST') verb = 'CREATE';
  else if (method === 'PUT') verb = 'UPDATE';
  else if (method === 'PATCH') verb = 'MODIFY';
  else if (method === 'DELETE') verb = 'DELETE';

  const action = specificAction || `${resource.toUpperCase()}_${verb}`;
  return { resource, action };
};

/**
 * Universal Global Audit Middleware
 * Intercepts mutating requests (POST, PUT, PATCH, DELETE) and records immutable audit log.
 */
export const globalAuditMiddleware = (req, res, next) => {
  // Only intercept state-mutating requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Avoid logging audit log endpoints to prevent recursion
  if (req.originalUrl?.includes('/audit-logs')) {
    return next();
  }

  const startTime = Date.now();
  let responseData = null;

  // Intercept res.json
  const originalJson = res.json;
  res.json = function (body) {
    responseData = body;
    return originalJson.apply(this, arguments);
  };

  // Intercept res.send
  const originalSend = res.send;
  res.send = function (body) {
    if (!responseData && typeof body === 'string') {
      try {
        responseData = JSON.parse(body);
      } catch (_) {}
    }
    return originalSend.apply(this, arguments);
  };

  // After response completes, write immutable audit record
  res.on('finish', () => {
    // Run asynchronously without blocking response
    setImmediate(async () => {
      try {
        // If an explicit audit was already logged by controller, skip duplicate
        if (req._auditLogged) return;

        const { resource, action } = deriveActionFromReq(req);
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
        const status = isSuccess ? 'SUCCESS' : 'FAILURE';

        const sanitizedBody = sanitizePayload(req.body);
        const resourceId =
          req.params?.id ||
          responseData?.data?._id ||
          responseData?.data?.id ||
          req.body?._id ||
          null;

        const actorUser = req.user;
        const actorName = actorUser
          ? `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim() || actorUser.username
          : req.body?.username || req.body?.email || 'Guest / Unauthenticated';

        const actorRole = actorUser?.role?.name || (actorUser ? 'USER' : 'GUEST');

        const description = `${actorName} (${actorRole}) executed ${req.method} on ${req.originalUrl} [${res.statusCode}]`;

        await logAudit({
          req,
          actor: actorUser,
          action,
          resource,
          resourceId,
          description,
          diff: {
            before: null,
            after: sanitizedBody && Object.keys(sanitizedBody).length > 0 ? sanitizedBody : null,
          },
          details: {
            statusCode: res.statusCode,
            method: req.method,
            endpoint: req.originalUrl,
            params: req.params,
            durationMs: Date.now() - startTime,
            message: responseData?.message || (isSuccess ? 'Operation succeeded' : 'Operation failed'),
          },
          status,
          failureReason: isSuccess ? null : (responseData?.message || `HTTP ${res.statusCode}`),
        });
      } catch (auditErr) {
        logger.error('Failed to write global audit log entry:', auditErr.message);
      }
    });
  });

  next();
};

export const auditMiddleware = (resourceName) => {
  return globalAuditMiddleware;
};

export default globalAuditMiddleware;
