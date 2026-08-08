import { chmodSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const binaryPath = path.join(currentDirectory, 'pocketbase');
const dataDirectory = process.env.PB_DATA_DIR?.trim() || '/data';
const port = process.env.PB_PORT?.trim() || '8090';

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

const pocketBase = spawn(binaryPath, args, {
	stdio: 'inherit',
	env: process.env,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => pocketBase.kill(signal));
}

pocketBase.on('error', (error) => {
	console.error('Failed to start PocketBase:', error);
	process.exit(1);
});

pocketBase.on('exit', (code, signal) => {
	console.error(
		`PocketBase process exited (code: ${code ?? 'none'}, signal: ${signal ?? 'none'})`,
	);
});
