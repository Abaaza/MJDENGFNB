// src/app.js
import express from 'express';
import cors from 'cors';
import connect from './config/db.js'; // Updated: now imports the async connect function

// Await DB connection before setting up routes
await connect(); // Ensures the DB is ready (works in Node.js 20 with ESM)

import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import boqRoutes from './routes/boq.routes.js';
import matchRoutes from './routes/match.routes.js';

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Route declarations
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/boq', boqRoutes);
app.use('/api/match', matchRoutes);

export default app;
