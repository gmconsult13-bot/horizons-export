// Stable production bootstrap for Raya Boutique.
// Start PocketBase on a per-process internal port, wait until it is healthy,
// then start Express. This prevents the frontend/API from coming online while
// the database is unavailable and avoids collisions with stale PocketBase
// processes left behind by a previous Hostinger deployment.

const internalPocketBasePort = String(
  Number(process.env.PB_PORT || 18090) + (process.pid % 500),
);

process.env.PB_PORT = internalPocketBasePort;
process.env.POCKETBASE_URL = `http://127.0.0.1:${internalPocketBasePort}`;
process.env.PB_URL = process.env.POCKETBASE_URL;

// Hostinger's lsnode launcher loads this entry point with CommonJS require().
// Keep the entry point synchronous and use dynamic imports inside the promise
// chain so the ESM API and PocketBase modules remain compatible with it.
import('./apps/pocketbase/start.js')
  .then(async ({ waitForPocketBase }) => {
    await waitForPocketBase({ timeoutMs: 20000 });
    await import('./apps/api/src/main.js');
  })
  .catch((error) => {
    console.error('Failed to start the Raya Boutique application:', error);
    process.exit(1);
  });
