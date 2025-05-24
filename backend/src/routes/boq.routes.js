// src/routes/boq.routes.js
import { Router } from 'express';
import { parseBoqFile, mergeBoq, importBluebeam } from '../services/boqService.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// upload and parse a BoQ spreadsheet
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    const rows = parseBoqFile(req.file.path);
    res.json(rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// merge client BoQ with system items
router.post('/merge', (req, res) => {
  const { clientBoq, systemItems } = req.body;
  const merged = mergeBoq(clientBoq || [], systemItems || []);
  res.json(merged);
});

// import measurements from BlueBeam export
router.post('/bluebeam', upload.single('file'), async (req, res) => {
  try {
    const items = await importBluebeam(req.file.path);
    res.json(items);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;