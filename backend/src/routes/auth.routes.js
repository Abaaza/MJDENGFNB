//src/routes/auth.js

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import sampleUsers from '../sampleUsers.js';

const router = Router();

/* Register */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Missing required fields' });

  if (process.env.CONNECTION_STRING) {
    if (await User.exists({ email }))
      return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password });
    const token = signToken({ id: user._id, name: user.name });
    return res.json({ token, user: { id: user._id, name: user.name } });
  }

  if (sampleUsers.find(u => u.email === email))
    return res.status(400).json({ message: 'Email already in use' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: nanoid(), name, email, password: hash };
  sampleUsers.push(user);
  const token = signToken({ id: user.id, name: user.name });
  res.json({ token, user: { id: user.id, name: user.name } });
});

/* Login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password)
    return res.status(400).json({ message: 'Missing credentials' });

  let user;
  if (process.env.CONNECTION_STRING) {
    user = await User.findOne({ email });
  } else {
    user = sampleUsers.find(u => u.email === email) || null;
  }

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(400).json({ message: 'Bad credentials' });

  const id = user._id || user.id;
  const token = signToken({ id, name: user.name });
  res.json({ token, user: { id, name: user.name } });
});

export default router;
