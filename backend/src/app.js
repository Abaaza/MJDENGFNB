//app.js
import express from 'express';
import cors    from 'cors';
import './config/db.js';           // <— just import; establishes pool

import authRoutes    from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import boqRoutes     from './routes/boq.routes.js';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/boq',      boqRoutes);

export default app;
