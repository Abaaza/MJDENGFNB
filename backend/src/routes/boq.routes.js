import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  importBluebeam,
  measurementsToBoq,
  parseBoqFile,
  mergeBoq,
  priceBoq,
} from '../services/boqService.js';
import { getProjectFolder, addAddendum, addBoqFile } from '../services/inquiryService.js';

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

const upload = multer({ storage: multer.memoryStorage() });


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

// Import BlueBeam file and merge with existing BoQ
router.post('/:projectId/bluebeam', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findOne({ id: projectId });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    // Parse BlueBeam measurements
    const tempPath = path.join('/tmp', `${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    const measurements = await importBluebeam(tempPath);
    fs.unlinkSync(tempPath);
    const bluebeamBoq = measurementsToBoq(measurements);

    const folder = getProjectFolder(projectId);
    if (!folder) return res.status(404).json({ message: 'Project folder not found' });
    addAddendum(folder, req.file.originalname, req.file.buffer);

    // Parse existing client BoQ if available
    let clientBoq = [];
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(folder, 'metadata.json'), 'utf8'));
      const last = meta.boq && meta.boq[meta.boq.length - 1];
      if (last) {
        const fp = path.join(folder, last.file);
        clientBoq = parseBoqFile(fp);
      }
    } catch {}

    const merged = mergeBoq(clientBoq, bluebeamBoq);
    const outFile = `merged_${Date.now()}.json`;
    addBoqFile(folder, outFile, Buffer.from(JSON.stringify(merged, null, 2)));

    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'BlueBeam import failed' });
  }
});

// Price arbitrary BoQ items
router.post('/price', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }
    const rateFile = process.env.RATE_FILE;
    if (!rateFile) throw new Error('RATE_FILE not configured');
    const result = priceBoq(items, rateFile);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


export default router;