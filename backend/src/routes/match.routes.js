import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { openAiMatchFromFiles } from '../services/openAiService.js';
import { cohereMatchFromFiles } from '../services/cohereService.js';
import { fileURLToPath } from 'url';


const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve to the repo root's frontend price list file
// Current file is located at backend/src/routes, so go up three levels
// to reach the repo root before appending the frontend path
const PRICE_FILE = path.resolve(__dirname, '../../MJD-PRICELIST.xlsx');

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  console.log('Price match upload:', {
    name: req.file.originalname,
    size: req.file.size
  });
  const { openaiKey, cohereKey } = req.body;
  console.log('OpenAI key provided:', !!openaiKey);
  console.log('Cohere key provided:', !!cohereKey);
  try {
    let results;
    if (openaiKey && cohereKey) {
      const openaiResults = await openAiMatchFromFiles(
        PRICE_FILE,
        req.file.buffer,
        openaiKey
      );
      const cohereResults = await cohereMatchFromFiles(
        PRICE_FILE,
        req.file.buffer,
        cohereKey
      );
      results = openaiResults.map((o, idx) => {
        const c = cohereResults[idx] || { matches: [] };
        const openaiBest = o.matches[0];
        const cohereBest = (c.matches || [])[0];
        return {
          inputDescription: o.inputDescription,
          quantity: o.quantity,
          matches: [openaiBest, cohereBest].filter(Boolean)
        };
      });
    } else if (openaiKey) {
      results = await openAiMatchFromFiles(PRICE_FILE, req.file.buffer, openaiKey);
    } else if (cohereKey) {
      results = await cohereMatchFromFiles(
        PRICE_FILE,
        req.file.buffer,
        cohereKey
      );
    } else {
      return res.status(400).json({ message: 'No API key provided' });
    }
    console.log('Price match results:', results.length);
    res.json(results);
  } catch (err) {
    console.error('Price match error:', err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
