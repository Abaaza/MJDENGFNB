import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import sampleUsers from '../sampleUsers.js';

const router = Router();

/* 🚀 Register */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      console.warn('[Register] Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // MongoDB mode
    if (process.env.CONNECTION_STRING) {
      const exists = await User.exists({ email });
      if (exists) {
        console.warn('[Register] Email already in use:', email);
        return res.status(400).json({ message: 'Email already in use' });
      }

      const user = await User.create({ name, email, password });
      const token = signToken({ id: user._id, name: user.name });
      console.log('[Register] New user created:', user._id);

      return res.json({ token, user: { id: user._id, name: user.name } });
    }

    // In-memory fallback
    if (sampleUsers.find(u => u.email === email)) {
      console.warn('[Register] Email already in use (in-memory):', email);
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = { id: nanoid(), name, email, password: hash };
    sampleUsers.push(user);
    const token = signToken({ id: user.id, name: user.name });

    console.log('[Register] User added to sample list:', user.id);
    return res.json({ token, user: { id: user.id, name: user.name } });

  } catch (err) {
    console.error('[Register] Internal error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* 🔐 Login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      console.warn('[Login] Missing credentials');
      return res.status(400).json({ message: 'Missing credentials' });
    }

    let user;

    // MongoDB mode
    if (process.env.CONNECTION_STRING) {
      user = await User.findOne({ email });
    } else {
      user = sampleUsers.find(u => u.email === email) || null;
    }

    if (!user) {
      console.warn('[Login] User not found:', email);
      return res.status(400).json({ message: 'Bad credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[Login] Incorrect password for:', email);
      return res.status(400).json({ message: 'Bad credentials' });
    }

    const id = user._id || user.id;
    const token = signToken({ id, name: user.name });

    console.log('[Login] Successful login:', id);
    return res.json({ token, user: { id, name: user.name } });

  } catch (err) {
    console.error('[Login] Internal error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
