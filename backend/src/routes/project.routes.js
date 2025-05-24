//src/routes/projects.js
import { Router } from 'express';
import Project from '../models/Project.js';
import sampleProjects from '../sampleProjects.js';

const router = Router();

// Fetch all projects
router.get('/', async (_req, res) => {
  // If a DB connection is configured, query it. Otherwise use the in-memory list
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

export default router;
