import { Router } from 'express';
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(h => h.trim());
  return lines.map(l => {
    const cols = l.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ? cols[i].trim() : '';
    });
    return obj;
  });
}
import BoqItem from '../models/BoqItem.js';
import Project from '../models/Project.js';

const router = Router();

// List BoQ items for a project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findOne({ id: projectId });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const items = await BoqItem.find({ projectId: project._id });
  res.json(items);
});

// Import BlueBeam CSV
router.post('/:projectId/import/bluebeam', async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findOne({ id: projectId });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ message: 'No CSV data provided' });
  try {
    const records = parseCSV(csv);
    const docs = records.map(r => ({
      projectId: project._id,
      itemCode: r.Code || '',
      description: r.Description || r.Name || '',
      quantity: parseFloat(r.Quantity || r.Length || '0'),
      unit: r.Unit || 'ea',
      unitRate: 0,
      total: 0,
      source: 'BLUEBEAM'
    }));
    const inserted = await BoqItem.insertMany(docs);
    res.json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Parse failed' });
  }
});

export default router;