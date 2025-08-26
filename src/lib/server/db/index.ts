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
			encryptionKey: undefined
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

			this.waiting.push((client: Client) => {
				clearTimeout(timer);
				resolve(client);
			});
		});
	}

	releaseClient(client: Client): void {
		if (this.waiting.length > 0) {
			const resolve = this.waiting.shift()!;
			resolve(client);
		} else {
			this.available.push(client);
		}
	}

	async close(): Promise<void> {
		await Promise.all(this.clients.map(client => client.close()));
		this.clients = [];
		this.available = [];
		this.waiting = [];
	}
}

// Initialize connection pool
const connectionPool = new ConnectionPool(DB_POOL_SIZE, DB_CONNECTION_TIMEOUT);

// Primary client for database operations
let primaryClient: Client;
let fallbackClient: Client | null = null;

// Initialize clients with fallback support and Alpine Linux compatibility
function initializeClients() {
	let libsqlInitialized = false;
	let betterSqliteInitialized = false;

	// Enhanced fallback for Docker/Alpine environments or libsql issues
	if (!DATABASE_URL.startsWith('libsql://') && !DATABASE_URL.startsWith('https://')) {
		// Check if we should prioritize better-sqlite3 (Alpine Linux compatibility)
		const useBetterSqlite3 = process.env.USE_BETTER_SQLITE3 === 'true' || 
								  process.env.DOCKER_ENV === 'true' ||
								  process.platform === 'linux';
		
		if (useBetterSqlite3) {
			try {
				// Try to import better-sqlite3 as primary for Alpine
				const Database = require('better-sqlite3');
				const dbPath = DATABASE_URL.startsWith('file:') 
					? DATABASE_URL.slice(5) 
					: DATABASE_URL;
				fallbackClient = new Database(dbPath, {
					verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
					fileMustExist: false,
					timeout: 30000,
					readonly: false
				});
				betterSqliteInitialized = true;
				console.log('✅ better-sqlite3 client initialized for Alpine Linux compatibility');
			} catch (e) {
				console.warn('⚠️ better-sqlite3 not available:', e.message);
			}
		}
	}

	// Try to initialize libsql client
	try {
		primaryClient = createClient({
			url: DATABASE_URL.startsWith('libsql://') || DATABASE_URL.startsWith('https://') 
				? DATABASE_URL 
				: `file:${DATABASE_URL}`,
			authToken: DATABASE_AUTH_TOKEN
		});
		libsqlInitialized = true;
		console.log('✅ libsql client initialized successfully');
	} catch (error) {
		console.error('❌ Failed to initialize libsql client:', error.message);
		
		// If libsql fails and we don't have better-sqlite3, try to initialize it now
		if (!betterSqliteInitialized && (!DATABASE_URL.startsWith('libsql://') && !DATABASE_URL.startsWith('https://'))) {
			try {
				const Database = require('better-sqlite3');
				const dbPath = DATABASE_URL.startsWith('file:') 
					? DATABASE_URL.slice(5) 
					: DATABASE_URL;
				fallbackClient = new Database(dbPath, {
					verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
					fileMustExist: false,
					timeout: 30000,
					readonly: false
				});
				betterSqliteInitialized = true;
				console.log('✅ better-sqlite3 client initialized as libsql fallback');
			} catch (fallbackError) {
				console.error('❌ Failed to initialize better-sqlite3 fallback:', fallbackError.message);
			}
		}
	}

	// Ensure we have at least one working client
	if (!libsqlInitialized && !betterSqliteInitialized) {
		const errorMsg = 'Failed to initialize any database client (libsql or better-sqlite3)';
		console.error('💀', errorMsg);
		throw new Error(errorMsg);
	}

	console.log('🗄️ Database initialization summary:', {
		libsql: libsqlInitialized ? '✅' : '❌',
		betterSqlite3: betterSqliteInitialized ? '✅' : '❌',
		platform: process.platform,
		dockerEnv: process.env.DOCKER_ENV,
		useFallback: process.env.USE_BETTER_SQLITE3
	});
}

// Initialize SQLite pragmas for optimal performance
async function initializePragmas(client: Client) {
	if (!DATABASE_URL.startsWith('libsql://') && !DATABASE_URL.startsWith('https://')) {
		try {
			const pragmas = [
				// Try WAL2 mode first, fallback to WAL for better concurrency
				{ sql: 'PRAGMA journal_mode = WAL2', fallback: 'PRAGMA journal_mode = WAL' },
				// Extended busy timeout for high concurrency
				{ sql: 'PRAGMA busy_timeout = 10000' },
				// 64MB cache for better performance
				{ sql: 'PRAGMA cache_size = -64000' },
				// Memory-mapped I/O for better performance (30GB limit)
				{ sql: 'PRAGMA mmap_size = 30000000000' },
				// Store temporary tables in memory
				{ sql: 'PRAGMA temp_store = MEMORY' },
				// NORMAL synchronous for balance of safety and performance
				{ sql: 'PRAGMA synchronous = NORMAL' },
				// Enable foreign key constraints
				{ sql: 'PRAGMA foreign_keys = ON' },
				// Optimize for read-heavy workloads
				{ sql: 'PRAGMA read_uncommitted = true' },
				// Optimize checkpoint behavior
				{ sql: 'PRAGMA wal_autocheckpoint = 1000' },
				// Optimize page size (4KB is optimal for most workloads)
				{ sql: 'PRAGMA page_size = 4096' }
			];

			for (const pragma of pragmas) {
				try {
					await client.execute(pragma.sql);
				} catch (error) {
					if (pragma.fallback) {
						try {
							await client.execute(pragma.fallback);
							console.log(`Applied fallback pragma: ${pragma.fallback}`);
						} catch (fallbackError) {
							console.warn(`Failed to apply pragma and fallback: ${pragma.sql}`, fallbackError);
						}
					} else {
						console.warn(`Failed to apply pragma: ${pragma.sql}`, error);
					}
				}
			}

			// Verify WAL mode is active
			const result = await client.execute('PRAGMA journal_mode');
			const journalMode = result.rows[0]?.[0];
			console.log(`SQLite journal mode: ${journalMode}`);
			console.log('SQLite pragmas initialized for optimal performance and concurrency');

			// Log database info for debugging
			const dbInfo = await Promise.all([
				client.execute('PRAGMA cache_size'),
				client.execute('PRAGMA busy_timeout'),
				client.execute('PRAGMA synchronous'),
				client.execute('PRAGMA mmap_size')
			]);

			console.log('Database configuration:', {
				cacheSize: dbInfo[0].rows[0]?.[0],
				busyTimeout: dbInfo[1].rows[0]?.[0],
				synchronous: dbInfo[2].rows[0]?.[0],
				mmapSize: dbInfo[3].rows[0]?.[0]
			});

		} catch (error) {
			console.error('Failed to initialize SQLite pragmas:', error);
			// In Docker environments, some pragmas might fail - continue anyway
			if (process.env.DOCKER_ENV || process.env.NODE_ENV === 'production') {
				console.log('Continuing in Docker/production environment despite pragma errors');
			} else {
				throw error;
			}
		}
	}
}

// Wrapper client with connection pooling and error handling for both libsql and better-sqlite3
class PooledClient {
	private getActiveClient() {
		// Prioritize fallback client (better-sqlite3) in Docker/Alpine environments
		if (fallbackClient && (process.env.USE_BETTER_SQLITE3 === 'true' || process.env.DOCKER_ENV === 'true')) {
			return fallbackClient;
		}
		// Use primary client (libsql) if available, otherwise fallback
		return primaryClient || fallbackClient;
	}

	private isBetterSqlite3Client(client: any): boolean {
		return client && typeof client.prepare === 'function' && !client.execute;
	}

	private async executeWithBetterSqlite3(client: any, sql: string, args?: any[]) {
		try {
			// better-sqlite3 uses different API
			const stmt = client.prepare(sql);
			if (sql.trim().toLowerCase().startsWith('select')) {
				const results = args ? stmt.all(...args) : stmt.all();
				return {
					rows: results,
					columns: Object.keys(results[0] || {}),
					rowsAffected: 0
				};
			} else {
				const result = args ? stmt.run(...args) : stmt.run();
				return {
					rows: [],
					columns: [],
					rowsAffected: result.changes || 0,
					lastInsertRowid: result.lastInsertRowid
				};
			}
		} catch (error) {
			// Convert better-sqlite3 errors to libsql format
			throw new Error(`Database error: ${error.message}`);
		}
	}

	async execute(sql: string, args?: any[]) {
		const client = this.getActiveClient();
		
		if (!client) {
			throw new Error('No database client available');
		}

		try {
			// Handle better-sqlite3 client differently
			if (this.isBetterSqlite3Client(client)) {
				return await this.executeWithBetterSqlite3(client, sql, args);
			}

			// Use connection pool for libsql clients
			const pooledClient = await connectionPool.getClient();
			try {
				return await pooledClient.execute(sql, args);
			} catch (error) {
				// Retry logic for common SQLite errors
				if (error instanceof Error && error.message.includes('database is locked')) {
					console.warn('Database locked, retrying...', { sql, args });
					await new Promise(resolve => setTimeout(resolve, 100));
					return await pooledClient.execute(sql, args);
				}
				
				// Try fallback client if primary fails with native module error
				if (error.message.includes('Could not dynamically require') && fallbackClient && client !== fallbackClient) {
					console.warn('Primary client failed with native module error, trying fallback...');
					return await this.executeWithBetterSqlite3(fallbackClient, sql, args);
				}
				
				throw error;
			} finally {
				connectionPool.releaseClient(pooledClient);
			}
		} catch (error) {
			console.error('Database execute error:', { sql, args, error: error.message });
			throw error;
		}
	}

	async batch(statements: any[]) {
		const client = this.getActiveClient();
		
		if (!client) {
			throw new Error('No database client available');
		}

		// Handle better-sqlite3 batch operations
		if (this.isBetterSqlite3Client(client)) {
			const transaction = client.transaction((statements: any[]) => {
				for (const stmt of statements) {
					const prepared = client.prepare(stmt.sql);
					if (stmt.args) {
						prepared.run(...stmt.args);
					} else {
						prepared.run();
					}
				}
			});
			transaction(statements);
			return { rows: [], columns: [], rowsAffected: statements.length };
		}

		// Use connection pool for libsql clients
		const pooledClient = await connectionPool.getClient();
		try {
			return await pooledClient.batch(statements);
		} catch (error) {
			// Try fallback for batch operations
			if (fallbackClient && client !== fallbackClient && this.isBetterSqlite3Client(fallbackClient)) {
				console.warn('Primary batch failed, trying fallback...');
				const transaction = fallbackClient.transaction((statements: any[]) => {
					for (const stmt of statements) {
						const prepared = fallbackClient.prepare(stmt.sql);
						if (stmt.args) {
							prepared.run(...stmt.args);
						} else {
							prepared.run();
						}
					}
				});
				transaction(statements);
				return { rows: [], columns: [], rowsAffected: statements.length };
			}
			throw error;
		} finally {
			connectionPool.releaseClient(pooledClient);
		}
	}

	async transaction(callback: (tx: any) => Promise<any>) {
		const client = this.getActiveClient();
		
		if (!client) {
			throw new Error('No database client available');
		}

		// Handle better-sqlite3 transactions
		if (this.isBetterSqlite3Client(client)) {
			return new Promise((resolve, reject) => {
				const transaction = client.transaction(async () => {
					try {
						const result = await callback(this);
						resolve(result);
					} catch (error) {
						reject(error);
					}
				});
				transaction();
			});
		}

		// Use connection pool for libsql transactions
		const pooledClient = await connectionPool.getClient();
		try {
			return await pooledClient.transaction(callback);
		} catch (error) {
			// Try fallback for transactions
			if (fallbackClient && client !== fallbackClient && this.isBetterSqlite3Client(fallbackClient)) {
				console.warn('Primary transaction failed, trying fallback...');
				return new Promise((resolve, reject) => {
					const transaction = fallbackClient.transaction(async () => {
						try {
							const result = await callback(this);
							resolve(result);
						} catch (error) {
							reject(error);
						}
					});
					transaction();
				});
			}
			throw error;
		} finally {
			connectionPool.releaseClient(pooledClient);
		}
	}

	async close() {
		await connectionPool.close();
		if (primaryClient && typeof primaryClient.close === 'function') {
			await primaryClient.close();
		}
		if (fallbackClient && typeof fallbackClient.close === 'function') {
			await fallbackClient.close();
		}
	}
}

// Initialize clients and pragmas
initializeClients();

// Initialize the pooled client
const pooledClient = new PooledClient();

// Initialize pragmas on startup
initializePragmas(primaryClient).catch(error => {
	console.error('Failed to initialize pragmas on startup:', error);
	// Continue anyway for Docker environments
	if (!process.env.DOCKER_ENV && process.env.NODE_ENV !== 'production') {
		process.exit(1);
	}
});

// Initialize database with schema using pooled client
export const db = drizzle(pooledClient as any, { schema });

// Export clients for raw queries if needed
export { primaryClient as client, pooledClient, connectionPool };

// Graceful shutdown handling
process.on('SIGINT', async () => {
	console.log('Shutting down database connections...');
	await pooledClient.close();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('Shutting down database connections...');
	await pooledClient.close();
	process.exit(0);
});