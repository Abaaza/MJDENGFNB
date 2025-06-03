import app from './src/app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀  API running on http://localhost:${PORT}`)
);

// Email and status watchers are no longer used

