import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import { canTransitionStatus } from '../lib/status.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type.'));
    }
    cb(null, true);
  }
});

const buildStatusEntry = (caseItem, toStatus, changedBy, note = '') => ({
  caseId: caseItem._id,
  fromStatus: caseItem.status,
  toStatus,
  changedBy,
  note
});

const validateCasePayload = (body) => {
  const { clientName, subjectName, caseType, dueDate, assignedTo } = body;
  if (!clientName || !subjectName || !caseType || !dueDate) {
    throw new Error('Client name, subject name, case type, and due date are required.');
  }

  if (assignedTo && typeof assignedTo !== 'string') {
    throw new Error('Assigned to must be a user id string.');
  }

  if (Number.isNaN(Date.parse(dueDate))) {
    throw new Error('Due date is invalid.');
  }
};

router.get('/', protect, async (req, res, next) => {
  try {
    const { status, agent, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'Agent') {
      query.assignedTo = req.user._id;
    }

    if (status) query.status = status;
    if (agent) query.assignedTo = agent;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { clientName: searchRegex },
        { subjectName: searchRegex },
        { caseType: searchRegex }
      ];
    }

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      items: cases,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      total
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, requireRole('Manager'), async (req, res, next) => {
  try {
    validateCasePayload(req.body);

    const assignedTo = await User.findById(req.body.assignedTo);
    if (!assignedTo || assignedTo.role !== 'Agent') {
      return res.status(400).json({ message: 'Assigned agent is invalid.' });
    }

    const caseItem = await Case.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'New'
    });

    caseItem.auditLog.push({
      caseId: caseItem._id,
      fromStatus: null,
      toStatus: 'New',
      changedBy: req.user._id,
      note: 'Case created'
    });
    await caseItem.save();

    res.status(201).json(caseItem);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name role')
      .populate('comments.author', 'name role')
      .populate('auditLog.changedBy', 'name role')
      .populate('documents.uploadedBy', 'name role');

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    if (req.user.role === 'Agent' && caseItem.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this case.' });
    }

    res.json(caseItem);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    if (!canTransitionStatus(caseItem.status, status)) {
      return res.status(400).json({ message: `Invalid status transition from ${caseItem.status} to ${status}.` });
    }

    if (req.user.role === 'Manager') {
      const allowedManagerStates = ['Assigned', 'Cleared', 'Discrepant'];
      if (!allowedManagerStates.includes(status)) {
        return res.status(403).json({ message: 'Managers can only assign or close cases.' });
      }
      if (status === 'Assigned') {
        if (!req.body.assignedTo) {
          return res.status(400).json({ message: 'Assigned agent is required.' });
        }
        const agent = await User.findById(req.body.assignedTo);
        if (!agent || agent.role !== 'Agent') {
          return res.status(400).json({ message: 'Assigned agent is invalid.' });
        }
        caseItem.assignedTo = agent._id;
      }
      if (status === 'Cleared' || status === 'Discrepant') {
        caseItem.managerReview = note || caseItem.managerReview;
      }
    }

    if (req.user.role === 'Agent') {
      if (caseItem.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your assigned cases.' });
      }
      const allowedAgentStates = ['In Progress', 'Submitted'];
      if (!allowedAgentStates.includes(status)) {
        return res.status(403).json({ message: 'Agents can only move cases to In Progress or Submitted.' });
      }
      caseItem.assignedTo = caseItem.assignedTo || req.user._id;
    }

    const previousStatus = caseItem.status;
    caseItem.status = status;
    caseItem.auditLog.push(buildStatusEntry(caseItem, status, req.user._id, note || ''));
    caseItem.auditLog[caseItem.auditLog.length - 1].fromStatus = previousStatus;
    await caseItem.save();

    res.json(caseItem);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    if (req.user.role === 'Agent' && caseItem.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this case.' });
    }

    caseItem.comments.push({ body, author: req.user._id });
    await caseItem.save();
    const populated = await caseItem.populate('comments.author', 'name role');
    res.status(201).json(populated.comments[populated.comments.length - 1]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/documents', protect, requireRole('Agent'), upload.single('file'), async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    if (caseItem.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this case.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A document file is required.' });
    }

    const document = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    };

    caseItem.documents.push(document);
    await caseItem.save();
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

export default router;
