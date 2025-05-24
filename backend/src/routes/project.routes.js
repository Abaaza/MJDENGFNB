//src/routes/projects.js
import { Router } from 'express';
import sampleProjects from '../sampleProjects.js';


const router = Router();

router.get('/', (_req, res) => {
  // serve the projects sorted by due date
  const projects = [...sampleProjects].sort((a, b) =>
    new Date(a.due) - new Date(b.due)
  );
  res.json(projects);
});

// POST endpoint kept for future expansion; currently returns 501
router.post('/', (_req, res) => {
  res.status(501).json({ message: 'Not implemented in sample mode' });});

export default router;

