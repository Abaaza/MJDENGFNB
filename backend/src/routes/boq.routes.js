// src/routes/boq.routes.js
import { Router } from 'express';
import { parseBoqFile, mergeBoq, importBluebeam, priceBoq } from '../services/boqService.js';
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

// price a list of BoQ items and calculate profit margin
router.post('/price', (req, res) => {
  try {
    const items = req.body.items || [];
    const rateFile = process.env.RATE_FILE;
    if (!rateFile) throw new Error('RATE_FILE not configured');
    const priced = priceBoq(items, rateFile);
    res.json(priced);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


export default router;