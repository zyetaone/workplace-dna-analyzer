import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Basic health check
		const healthData = {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			version: '0.0.2',
			platform: process.platform,
			nodeVersion: process.version,
			env: process.env.NODE_ENV,
			docker: process.env.DOCKER_ENV === 'true',
			database: {
				url: process.env.DATABASE_URL ? 'configured' : 'not configured',
				useFallback: process.env.USE_BETTER_SQLITE3 === 'true'
			}
		};

		return json(healthData, { status: 200 });
	} catch (error) {
		console.error('Health check failed:', error);
		return json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 503 }
		);
	}
};