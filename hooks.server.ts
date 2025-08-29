import { dev } from '$app/environment';

// Load environment variables
export async function handle({ event, resolve }) {
	// Ensure environment variables are loaded
	if (dev) {
		console.log('🔧 Development mode - loading environment variables');
		console.log('OPENAI_API_KEY status:', process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Not found');
	}

	return resolve(event);
}
