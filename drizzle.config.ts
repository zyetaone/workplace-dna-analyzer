import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL || './local.db';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: DATABASE_URL },
	out: './drizzle',
	verbose: true,
	strict: true
});
