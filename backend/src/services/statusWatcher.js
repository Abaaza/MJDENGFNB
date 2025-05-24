import Project from '../models/Project.js';
import sampleProjects from '../sampleProjects.js';
import { sendReminder } from './notificationService.js';

const CHECK_INTERVAL = 60 * 60 * 1000; // hourly
const STALE_HOURS = 48;

async function fetchProjects() {
  if (process.env.CONNECTION_STRING) {
    return Project.find().exec();
  }
  return sampleProjects;
}

async function checkStale() {
  const projects = await fetchProjects();
  const now = Date.now();
  for (const p of projects) {
    const updated = new Date(p.updatedAt || p.createdAt || p.due);
    const age = now - updated.getTime();
    if (age > STALE_HOURS * 3600_000) {
      await sendReminder(p);
    }
  }
}

export function startStatusWatcher() {
  checkStale().catch(err => console.error('Status watcher error:', err));
  setInterval(() => checkStale().catch(err => console.error('Status watcher error:', err)), CHECK_INTERVAL);
}