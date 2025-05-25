//src/routes/projects.js
import { Router } from 'express';
import Project from '../models/Project.js';
import sampleProjects from '../sampleProjects.js';
import multer from 'multer';
import fs from 'fs';
import { getProjectFolder, addAddendum, addBoqFile } from '../services/inquiryService.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Fetch all projects
router.get('/', async (_req, res) => {
  if (process.env.CONNECTION_STRING) {
    const projects = await Project.find().sort({ due: 1 }).exec();
    return res.json(projects);
  }

  const projects = [...sampleProjects].sort(
    (a, b) => new Date(a.due) - new Date(b.due)
  );
  res.json(projects);
});

// Create a new project
router.post('/', async (req, res) => {
  const { id, client, type, due } = req.body;
  if (!(id && client && type && due)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (process.env.CONNECTION_STRING) {
    try {
      const doc = await Project.create({ id, client, type, due });
      return res.status(201).json(doc);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  if (sampleProjects.find(p => p.id === id)) {
    return res.status(400).json({ message: 'Project already exists' });
  }
  const project = { id, client, type, due, status: 'NEW' };
  sampleProjects.push(project);
  res.status(201).json(project);
});

// Fetch a single project
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (process.env.CONNECTION_STRING) {
    const doc = await Project.findOne({ id }).exec();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  }
  const proj = sampleProjects.find(p => p.id === id);
  if (!proj) return res.status(404).json({ message: 'Not found' });
  res.json(proj);
});

// Update a project (status or details)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  if (process.env.CONNECTION_STRING) {
    try {
      const doc = await Project.findOneAndUpdate({ id }, updates, {
        new: true,
      }).exec();
      if (!doc) return res.status(404).json({ message: 'Not found' });
      return res.json(doc);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  const idx = sampleProjects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  sampleProjects[idx] = { ...sampleProjects[idx], ...updates };
  res.json(sampleProjects[idx]);
});

// -------- document management ---------

router.post('/:id/documents', upload.single('file'), (req, res) => {
  const folder = getProjectFolder(req.params.id);
  if (!folder) return res.status(404).json({ message: 'Project folder not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    addAddendum(folder, req.file.originalname, req.file.buffer);
    res.status(201).json({ message: 'Uploaded' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id/documents', (req, res) => {
  const folder = getProjectFolder(req.params.id);
  if (!folder) return res.status(404).json({ message: 'Project folder not found' });
  try {
    const files = fs
      .readdirSync(folder)
      .filter(f => !['metadata.json', 'current.txt'].includes(f));
    res.json(files);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/boq', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const folder = getProjectFolder(id);
  if (!folder) return res.status(404).json({ message: 'Project folder not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    addBoqFile(folder, req.file.originalname, req.file.buffer);
    if (process.env.CONNECTION_STRING) {
      await Project.findOneAndUpdate({ id }, { boqUploaded: true }).exec();
    } else {
      const p = sampleProjects.find(p => p.id === id);
      if (p) p.boqUploaded = true;
    }
    res.status(201).json({ message: 'BoQ uploaded' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
