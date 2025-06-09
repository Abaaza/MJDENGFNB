import { Router } from 'express';
import PriceItem from '../models/PriceItem.js';

const router = Router();

// List all price items
router.get('/', async (req, res) => {
  const items = await PriceItem.find({}).sort({ description: 1 }).lean();
  res.json(items);
});

// Search by code, description or other fields
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const regex = new RegExp(q, 'i');
  const items = await PriceItem.find({
    $or: [
      { description: regex },
      { code: regex },
      { ref: regex },
      { category: regex },
      { subCategory: regex },
      { keywords: regex },
      { phrases: regex },
    ]
  })
    .sort({ description: 1 })
    .limit(20)
    .lean();
  res.json(items);
});

// Create a new price item
router.post('/', async (req, res) => {
  try {
    const doc = await PriceItem.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an existing price item
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PriceItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
