import app from './src/app.js';
import { startEmailListener } from './src/services/emailListener.js';
import { startStatusWatcher } from './src/services/statusWatcher.js';


const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀  API running on http://localhost:${PORT}`)
);

// Kick off the mailbox watcher unless disabled
if (!process.env.DISABLE_EMAIL_LISTENER) {
  startEmailListener().catch(err =>
    console.error('Email listener failed to start:', err)
  );
} else {
  console.log('📭 Email listener disabled');
}

// Start watcher to send reminders for stale projects
if (!process.env.DISABLE_STATUS_WATCHER) {
  startStatusWatcher();
} else {
  console.log('⏸️  Status watcher disabled');
}