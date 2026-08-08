import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const webDistDirectory = path.resolve(currentDirectory, '../../web/dist');
const pocketBaseUrl =
	process.env.POCKETBASE_URL?.trim() ||
	process.env.PB_URL?.trim() ||
	'http://127.0.0.1:8090';

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet({
	// The existing site loads hotel images, analytics, and fonts from external
	// providers. Keep their current behaviour while still applying Helmet's
	// remaining security headers.
	contentSecurityPolicy: false,
}));
app.use(cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
}));
app.use(morgan('combined'));
app.use(globalRateLimit);

// Keep the public URLs used by the exported Horizons frontend. Mount this
// before the body parsers so file uploads and other request streams reach
// PocketBase unchanged.
app.use('/hcgi/platform', createProxyMiddleware({
	target: pocketBaseUrl,
	changeOrigin: true,
	ws: true,
}));

app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

app.use('/hcgi/api', routes());

app.use(express.static(webDistDirectory));

// React Router routes such as /rooms and /admin/login must return index.html
// when they are opened directly in the browser.
app.use((req, res, next) => {
	if (req.method === 'GET' && req.accepts('html')) {
		return res.sendFile(path.join(webDistDirectory, 'index.html'));
	}

	return next();
});

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
	logger.info(`🚀 API Server running on http://localhost:${port}`);
});

export default app;
