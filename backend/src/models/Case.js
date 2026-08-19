import mongoose from 'mongoose';

/**
 * @file Mongoose schema/model for a case, its embedded documents (uploaded
 * files), comments, and status-change audit log entries.
 */

/** Subdocument schema for a file uploaded against a case. */
const documentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

/** Subdocument schema for a comment left on a case. */
const commentSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

/** Subdocument schema recording a single status change for a case. */
const auditLogSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

/**
 * Schema for a case: the core work item tracked by the app, including its
 * client/subject details, lifecycle status, and embedded documents,
 * comments, and audit log.
 */
const caseSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    caseType: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared', 'Discrepant'],
      default: 'New'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managerReview: { type: String, default: '' },
    documents: [documentSchema],
    comments: [commentSchema],
    auditLog: [auditLogSchema]
  },
  { timestamps: true }
);

/** @typedef {import('mongoose').Document & {clientName: string, subjectName: string, caseType: string, dueDate: Date, status: string, assignedTo: import('mongoose').Types.ObjectId, createdBy: import('mongoose').Types.ObjectId, managerReview: string, documents: object[], comments: object[], auditLog: object[]}} CaseDocument */

/** Mongoose model for the `cases` collection. */
const Case = mongoose.model('Case', caseSchema);
export default Case;
