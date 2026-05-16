import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGIN_FAILED', 'LOGOUT',
      'LOGIN_TELEGRAM', 'REGISTER_TELEGRAM',
      'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'SETTINGS_CHANGE'
    ]
  },
  entity: {
    type: String,
    required: true,
    enum: ['USER', 'PRODUCT', 'ORDER', 'INVENTORY', 'SETTINGS', 'PROFILE', 'AUTH']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['User', 'Product', 'Order', 'Inventory']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByUsername: {
    type: String,
    required: true
  },
  performedByRole: {
    type: String,
    enum: ['admin', 'user'],
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  previousValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;