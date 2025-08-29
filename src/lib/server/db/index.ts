import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Use DATABASE_URL from env or default to local file
// LibSQL expects file URLs in the format 'file:./path' or 'file:///absolute/path'
let dbUrl = env.DATABASE_URL || './local.db';

// Ensure the URL has the correct format
if (dbUrl && !dbUrl.startsWith('file:') && !dbUrl.startsWith('libsql:') && !dbUrl.startsWith('http')) {
  // For local development, use relative path
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    dbUrl = `file:${dbUrl}`;
  } else {
    // For Coolify deployment, use /app/data/
    dbUrl = `file:/app/data/${dbUrl}`;
  }
}

const client = createClient({ url: dbUrl });

// Enable WAL mode for better concurrency and performance
// WAL2 is important for handling multiple concurrent participants
async function setupDatabase() {
  try {
    // Try WAL2 mode first (better concurrency than WAL)
    await client.execute('PRAGMA journal_mode = WAL2');
    // Reasonable timeout for concurrent access
    await client.execute('PRAGMA busy_timeout = 5000');
    // Standard synchronous mode for WAL
    await client.execute('PRAGMA synchronous = NORMAL');
    console.log('Database initialized with WAL2 mode');
  } catch (error) {
    // Fallback to WAL if WAL2 is not available
    try {
      await client.execute('PRAGMA journal_mode = WAL');
      await client.execute('PRAGMA busy_timeout = 5000');
      await client.execute('PRAGMA synchronous = NORMAL');
      console.log('Database initialized with WAL mode');
    } catch (e) {
      // SQLite will use default mode if WAL is not available
      console.warn('Could not enable WAL mode, using default');
    }
  }
}

// Initialize database settings
setupDatabase().catch(console.error);

export const db = drizzle(client, { schema });
