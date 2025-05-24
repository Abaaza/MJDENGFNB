import app from './src/app.js';
import { startEmailListener } from './src/services/emailListener.js';


const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀  API running on http://localhost:${PORT}`)
);

// Kick off the mailbox watcher
startEmailListener().catch(err =>
  console.error('Email listener failed to start:', err)
  );
