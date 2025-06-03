import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { matchFromFiles } from '../services/matchService.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const PRICE_FILE = path.resolve('frontend/MJD-PRICELIST.xlsx');

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const results = matchFromFiles(PRICE_FILE, req.file.buffer);
    res.json(results);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
