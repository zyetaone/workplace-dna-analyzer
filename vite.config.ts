import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: { 
		port: 5173, 
		host: true,  // Expose on all network interfaces
		
		hmr: {
			host: 'localhost'  // HMR only on localhost
		}
	},
	preview: {
		port: 4173,
		host: true,  // Expose preview on all interfaces
		strictPort: true,
		// Allow any host to connect (for tunnels and local network)
		allowedHosts: [
			'localhost',
			'.bore.pub',  // Allow bore.pub subdomains
			'.ngrok.io',  // Allow ngrok
			'.loca.lt',   // Allow localtunnel
			'.trycloudflare.com',  // Allow cloudflare tunnel
			'192.168.0.0/16',  // Allow local network
			'172.16.0.0/12',   // Allow Docker/WSL networks
			'10.0.0.0/8'       // Allow private networks
		]
	}
});
