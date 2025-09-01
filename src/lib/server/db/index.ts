import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Use DATABASE_URL from env or default to local file
// LibSQL expects file URLs in the format 'file:./path' or 'file:///absolute/path'
let dbUrl = env.DATABASE_URL || 'file:./local.db';

const IS_DEV = process.env.NODE_ENV !== 'production';

const client = createClient({ url: dbUrl });

// Enable WAL mode for better concurrency and performance
async function setupDatabase() {
	try {
		await client.execute('PRAGMA journal_mode = WAL');
		await client.execute('PRAGMA busy_timeout = 5000');
		await client.execute('PRAGMA synchronous = NORMAL');
		if (IS_DEV) console.log('Database initialized with WAL mode');
	} catch (e) {
		// SQLite will use default mode if WAL is not available
		console.warn('Could not enable WAL mode, using default');
	}
}

// Initialize database settings
setupDatabase().catch((err) => {
	console.error('Database setup error:', err);
});

export const db = drizzle(client, { schema });
