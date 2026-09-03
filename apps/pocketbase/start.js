import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const binaryPath = path.join(currentDirectory, 'pocketbase');
const port = process.env.PB_PORT?.trim() || '8090';
const pocketBaseUrl = `http://127.0.0.1:${port}`;

// Hostinger deploys every application version into a disposable hbuilds path.
// Keep PocketBase outside that version directory so registrations, bookings,
// rooms and admin changes survive redeployments.
const persistentDefault = process.env.HOME
  ? path.join(
      process.env.HOME,
      'domains',
      process.env.APP_DOMAIN?.trim() || 'rayaboutique.eu',
      'pb_data',
    )
  : path.join(currentDirectory, 'pb_data_runtime');

const dataDirectory = process.env.PB_DATA_DIR?.trim() || persistentDefault;
const legacyDataDirectory = '/data';

mkdirSync(dataDirectory, { recursive: true });

// One-time compatibility migration from the old /data location when it exists.
// Never overwrite an already populated persistent database.
try {
  const targetIsEmpty = readdirSync(dataDirectory).length === 0;
  if (
    targetIsEmpty &&
    dataDirectory !== legacyDataDirectory &&
    existsSync(legacyDataDirectory)
  ) {
    cpSync(legacyDataDirectory, dataDirectory, {
      recursive: true,
      force: false,
      errorOnExist: false,
    });
    console.log(`Migrated legacy PocketBase data from ${legacyDataDirectory} to ${dataDirectory}`);
  }
} catch (error) {
  console.warn('PocketBase legacy data migration was skipped:', error.message);
}

chmodSync(binaryPath, 0o755);

const args = [
  'serve',
  `--http=127.0.0.1:${port}`,
  `--dir=${dataDirectory}`,
  `--migrationsDir=${path.join(currentDirectory, 'pb_migrations')}`,
  `--hooksDir=${path.join(currentDirectory, 'pb_hooks')}`,
  '--hooksWatch=false',
];

if (process.env.PB_ENCRYPTION_KEY?.trim()) {
  args.push('--encryptionEnv=PB_ENCRYPTION_KEY');
}

let shuttingDown = false;

export const pocketBase = spawn(binaryPath, args, {
  stdio: 'inherit',
  env: process.env,
});

export const waitForPocketBase = async ({ timeoutMs = 20000 } = {}) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    if (pocketBase.exitCode !== null) {
      throw new Error(`PocketBase exited before becoming ready (code ${pocketBase.exitCode}).`);
    }

    try {
      const response = await fetch(`${pocketBaseUrl}/api/health`, {
        signal: AbortSignal.timeout(1500),
      });

      if (response.ok) {
        console.log(`PocketBase is ready at ${pocketBaseUrl} using ${dataDirectory}`);
        return pocketBaseUrl;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(
    `PocketBase did not become ready within ${timeoutMs}ms${lastError ? `: ${lastError.message}` : ''}`,
  );
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shuttingDown = true;
    if (pocketBase.exitCode === null) pocketBase.kill(signal);
  });
}

pocketBase.on('error', (error) => {
  console.error('Failed to start PocketBase:', error);
  process.exit(1);
});

pocketBase.on('exit', (code, signal) => {
  const message = `PocketBase process exited (code: ${code ?? 'none'}, signal: ${signal ?? 'none'})`;

  if (shuttingDown) {
    console.log(message);
    return;
  }

  console.error(message);
  process.exit(1);
});
