import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const webIndexFile = path.join(currentDirectory, 'apps', 'web', 'dist', 'index.html');

if (!existsSync(webIndexFile)) {
  console.log('Frontend build not found. Building apps/web before startup...');

  // Hostinger's runtime doesn't expose `npm` on PATH. Resolve the npm CLI
  // installed with Node and invoke it through the current Node executable.
  const require = createRequire(import.meta.url);
  let npmCli;

  try {
    npmCli = require.resolve('npm/bin/npm-cli.js');
  } catch (error) {
    console.error('Unable to locate the npm CLI in the Hostinger runtime.', error);
    process.exit(1);
  }

  const build = spawnSync(
    process.execPath,
    [npmCli, 'run', 'build', '--prefix', 'apps/web'],
    {
      cwd: currentDirectory,
      stdio: 'inherit',
      env: process.env,
    },
  );

  if (build.error || build.status !== 0 || !existsSync(webIndexFile)) {
    console.error(
      'Failed to build the Raya Boutique frontend before startup.',
      build.error || `Build exited with status ${build.status}`,
    );
    process.exit(1);
  }
}

Promise.all([
  import('./apps/pocketbase/start.js'),
  import('./apps/api/src/main.js'),
]).catch((error) => {
  console.error('Failed to start the Raya Boutique application:', error);
  process.exit(1);
});
