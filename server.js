Promise.all([
  import('./apps/pocketbase/start.js'),
  import('./apps/api/src/main.js'),
]).catch((error) => {
  console.error('Failed to start the Raya Boutique application:', error);
  process.exit(1);
});
