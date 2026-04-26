import AuditLog from "../models/AuditLog.js";

export const auditLog = (action, entity, description) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.json;
    
    res.json = function(data) {
      // Restore original send
      res.json = originalSend;
      
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Check if user info is available
          if (!req.user || !req.user.id) {
            console.warn('Audit log skipped: No user information available');
            return originalSend.call(this, data);
          }

          const auditEntry = {
            action,
            entity,
            entityId: req.params.id || data?.data?._id || data?.user?.id || null,
            performedBy: req.user.id,
            performedByUsername: req.user.username || 'Unknown',
            performedByRole: req.user.role || 'unknown',
            description: description || `${action} on ${entity}`,
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
            timestamp: new Date()
          };

          // Add changes if available
          if (req.body && (action === 'UPDATE' || action === 'CREATE')) {
            auditEntry.newValues = sanitizeData(req.body);
          }

          if (action === 'DELETE' && req.entity) {
            auditEntry.previousValues = sanitizeData(req.entity.toObject());
          }

          // Create audit log asynchronously
          AuditLog.create(auditEntry)
            .then(() => console.log(`Audit log created: ${action} by ${auditEntry.performedByUsername}`))
            .catch(err => console.error('Audit log creation failed:', err.message));
            
        } catch (error) {
          console.error('Audit middleware error:', error.message);
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Sanitize sensitive data
const sanitizeData = (data) => {
  if (!data) return {};
  const sanitized = { ...data };
  // Remove sensitive fields
  const sensitiveFields = ['password', '__v', 'token', 'secret', 'apiKey'];
  sensitiveFields.forEach(field => delete sanitized[field]);
  return sanitized;
};

// Track specific changes
export const trackChanges = (req, res, next) => {
  req.auditChanges = {
    previousValues: {},
    newValues: {}
  };
  
  req.trackChange = (field, oldValue, newValue) => {
    if (oldValue !== newValue) {
      req.auditChanges.previousValues[field] = oldValue;
      req.auditChanges.newValues[field] = newValue;
    }
  };
  
  next();
};