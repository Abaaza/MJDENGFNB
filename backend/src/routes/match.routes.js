import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { matchFromFiles } from '../services/matchService.js';
import { fileURLToPath } from 'url';


const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve to the repo root's frontend price list file
// Current file is located at backend/src/routes, so go up three levels
// to reach the repo root before appending the frontend path
const PRICE_FILE = path.resolve(
  __dirname,
  '../../../frontend/MJD-PRICELIST.xlsx'
);

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  console.log('Price match upload:', {
    name: req.file.originalname,
    size: req.file.size
  });
  try {
    const results = matchFromFiles(PRICE_FILE, req.file.buffer);
    console.log('Price match results:', results.length);
    res.json(results);
  } catch (err) {
    console.error('Price match error:', err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
