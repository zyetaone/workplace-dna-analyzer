import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Get database configuration
const DATABASE_URL = env.DATABASE_URL || './local.db';
const DATABASE_AUTH_TOKEN = env.DATABASE_AUTH_TOKEN;
const DB_POOL_SIZE = parseInt(env.DB_POOL_SIZE || '10');
const DB_CONNECTION_TIMEOUT = parseInt(env.DB_CONNECTION_TIMEOUT || '30000');

// Connection pool for better concurrency
class ConnectionPool {
	private clients: Client[] = [];
	private available: Client[] = [];
	private waiting: Array<(client: Client) => void> = [];
	private readonly maxSize: number;
	private readonly timeout: number;

	constructor(maxSize: number, timeout: number) {
		this.maxSize = maxSize;
		this.timeout = timeout;
	}

	private createClient(): Client {
		return createClient({
			url: DATABASE_URL.startsWith('libsql://') || DATABASE_URL.startsWith('https://') 
				? DATABASE_URL 
				: `file:${DATABASE_URL}`,
			authToken: DATABASE_AUTH_TOKEN,
			// Connection options for better performance
			syncUrl: undefined, // Disable sync for local files
			syncInterval: 0,
		});
	}

	async getClient(): Promise<Client> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				const index = this.waiting.indexOf(resolve);
				if (index !== -1) {
					this.waiting.splice(index, 1);
				}
				reject(new Error('Connection pool timeout'));
			}, this.timeout);

			if (this.available.length > 0) {
				clearTimeout(timer);
				const client = this.available.pop()!;
				resolve(client);
				return;
			}

			if (this.clients.length < this.maxSize) {
				clearTimeout(timer);
				const client = this.createClient();
				this.clients.push(client);
				resolve(client);
				return;
			}

			this.waiting.push((client) => {
				clearTimeout(timer);
				resolve(client);
			});
		});
	}

	releaseClient(client: Client): void {
		if (this.waiting.length > 0) {
			const waiter = this.waiting.shift()!;
			waiter(client);
		} else {
			this.available.push(client);
		}
	}

	async close(): Promise<void> {
		// Close all clients
		await Promise.all(this.clients.map(client => client.close()));
		this.clients = [];
		this.available = [];
		this.waiting = [];
	}

	get stats() {
		return {
			total: this.clients.length,
			available: this.available.length,
			waiting: this.waiting.length,
		};
	}
}

// Initialize connection pool
const connectionPool = new ConnectionPool(DB_POOL_SIZE, DB_CONNECTION_TIMEOUT);

// Create primary client for Drizzle
const primaryClient = createClient({
	url: DATABASE_URL.startsWith('libsql://') || DATABASE_URL.startsWith('https://') 
		? DATABASE_URL 
		: `file:${DATABASE_URL}`,
	authToken: DATABASE_AUTH_TOKEN,
	syncUrl: undefined,
	syncInterval: 0,
});

// Initialize Drizzle with libsql
export const db = drizzle(primaryClient, { schema });

// Initialize database with WAL2 mode for better concurrency
export async function initializeDatabase() {
	try {
		// Set WAL2 mode for better concurrent access
		await primaryClient.execute(`PRAGMA journal_mode = WAL`);
		await primaryClient.execute(`PRAGMA busy_timeout = 10000`);
		await primaryClient.execute(`PRAGMA cache_size = -64000`);
		await primaryClient.execute(`PRAGMA synchronous = NORMAL`);
		await primaryClient.execute(`PRAGMA temp_store = MEMORY`);
		await primaryClient.execute(`PRAGMA mmap_size = 30000000000`);
		
		// Optimize for read-heavy workloads
		await primaryClient.execute(`PRAGMA page_size = 4096`);
		await primaryClient.execute(`PRAGMA read_uncommitted = 1`);
		
		console.log('✅ Database initialized with WAL mode and optimizations');
		
		// Test the connection
		const result = await primaryClient.execute('SELECT 1');
		console.log('✅ Database connection verified');
		
		return true;
	} catch (error) {
		console.error('❌ Database initialization failed:', error);
		throw error;
	}
}

// Health check function
export async function healthCheck(): Promise<boolean> {
	try {
		await primaryClient.execute('SELECT 1');
		return true;
	} catch {
		return false;
	}
}

// Export connection pool for advanced usage
export { connectionPool };

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('Closing database connections...');
	await connectionPool.close();
	await primaryClient.close();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('Closing database connections...');
	await connectionPool.close();
	await primaryClient.close();
	process.exit(0);
});