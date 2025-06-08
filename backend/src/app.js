// src/app.js
import express from 'express';
import cors from 'cors';
import connect from './config/db.js'; // async connection function

// ✅ Await DB connection before anything else (works in Node 20+ with top-level await)
await connect();

import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import boqRoutes from './routes/boq.routes.js';
import matchRoutes from './routes/match.routes.js';

const app = express();

// ✅ Middlewares (order matters)
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ strict: false })); // important for Lambda to parse body properly

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/boq', boqRoutes);
app.use('/api/match', matchRoutes);

export default app;
