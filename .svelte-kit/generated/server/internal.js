
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: null,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>Zyeta DX - Workplace Experience Platform</title>\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t<meta name=\"description\" content=\"Transform workplace insights with real-time engagement and analytics\" />\n\t\t<link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n\t\t<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap\" rel=\"stylesheet\">\n\t\t<style>\n\t\t\t/* Zyeta DX Loading Screen */\n\t\t\t#zyeta-loading {\n\t\t\t\tposition: fixed;\n\t\t\t\ttop: 0;\n\t\t\t\tleft: 0;\n\t\t\t\twidth: 100vw;\n\t\t\t\theight: 100vh;\n\t\t\t\tbackground: #000;\n\t\t\t\tdisplay: flex;\n\t\t\t\tflex-direction: column;\n\t\t\t\tjustify-content: center;\n\t\t\t\talign-items: center;\n\t\t\t\tz-index: 9999;\n\t\t\t\ttransition: opacity 0.5s ease-out;\n\t\t\t}\n\t\t\t\n\t\t\t#zyeta-loading.fade-out {\n\t\t\t\topacity: 0;\n\t\t\t\tpointer-events: none;\n\t\t\t}\n\t\t\t\n\t\t\t.zyeta-logo-container {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\tmargin-bottom: 40px;\n\t\t\t}\n\t\t\t\n\t\t\t.zyeta-logo {\n\t\t\t\twidth: 200px;\n\t\t\t\theight: 200px;\n\t\t\t\tanimation: pulse 2s infinite;\n\t\t\t}\n\t\t\t\n\t\t\t.dx-text {\n\t\t\t\tfont-family: 'Dancing Script', cursive;\n\t\t\t\tfont-size: 72px;\n\t\t\t\tfont-weight: 700;\n\t\t\t\tcolor: #fff;\n\t\t\t\tmargin-left: -20px;\n\t\t\t\tmargin-top: 20px;\n\t\t\t\tanimation: slideIn 1s ease-out;\n\t\t\t}\n\t\t\t\n\t\t\t.loading-text {\n\t\t\t\tcolor: #fff;\n\t\t\t\tfont-family: system-ui, -apple-system, sans-serif;\n\t\t\t\tfont-size: 14px;\n\t\t\t\tletter-spacing: 2px;\n\t\t\t\ttext-transform: uppercase;\n\t\t\t\topacity: 0.8;\n\t\t\t\tmargin-top: 20px;\n\t\t\t}\n\t\t\t\n\t\t\t.loading-bar {\n\t\t\t\twidth: 200px;\n\t\t\t\theight: 2px;\n\t\t\t\tbackground: rgba(255, 255, 255, 0.1);\n\t\t\t\tborder-radius: 2px;\n\t\t\t\toverflow: hidden;\n\t\t\t\tmargin-top: 20px;\n\t\t\t}\n\t\t\t\n\t\t\t.loading-progress {\n\t\t\t\theight: 100%;\n\t\t\t\tbackground: linear-gradient(90deg, transparent, #fff, transparent);\n\t\t\t\tanimation: loading 1.5s infinite linear;\n\t\t\t}\n\t\t\t\n\t\t\t@keyframes pulse {\n\t\t\t\t0%, 100% { transform: scale(1); }\n\t\t\t\t50% { transform: scale(1.05); }\n\t\t\t}\n\t\t\t\n\t\t\t@keyframes slideIn {\n\t\t\t\tfrom { \n\t\t\t\t\topacity: 0;\n\t\t\t\t\ttransform: translateX(-30px);\n\t\t\t\t}\n\t\t\t\tto {\n\t\t\t\t\topacity: 1;\n\t\t\t\t\ttransform: translateX(0);\n\t\t\t\t}\n\t\t\t}\n\t\t\t\n\t\t\t@keyframes loading {\n\t\t\t\t0% { transform: translateX(-100%); }\n\t\t\t\t100% { transform: translateX(200%); }\n\t\t\t}\n\t\t</style>\n\t\t" + head + "\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<!-- Zyeta DX Loading Screen -->\n\t\t<div id=\"zyeta-loading\">\n\t\t\t<div class=\"zyeta-logo-container\">\n\t\t\t\t<svg class=\"zyeta-logo\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300\">\n\t\t\t\t\t<rect x=\"25.04\" y=\"25.04\" width=\"249.93\" height=\"249.93\" fill=\"#fff\"/>\n\t\t\t\t\t<g>\n\t\t\t\t\t\t<polygon fill=\"#000\" points=\"64.6 160.09 60.75 165.55 83.17 165.55 83.17 172.19 52.46 172.19 52.46 165.78 52.62 165.55 56.48 160.09 66.69 145.62 74.57 134.45 52.46 134.45 52.46 127.81 83.17 127.81 83.17 133.78 82.7 134.45 74.82 145.62 64.6 160.09\"/>\n\t\t\t\t\t\t<polygon fill=\"#000\" points=\"205.35 127.81 205.35 134.45 192.76 134.45 192.76 172.19 186.12 172.19 186.12 134.45 173.53 134.45 173.53 127.81 205.35 127.81\"/>\n\t\t\t\t\t\t<path fill=\"#000\" d=\"M244.96,165.55l-2.13-5.47-2.59-6.64-3.05-7.83-4.35-11.17-2.37-6.08-.22-.56h-6.69l-.22.56-2.37,6.08-4.35,11.17-3.05,7.83-2.59,6.64-2.13,5.47-2.59,6.64h7.12l2.59-6.64,2.13-5.47h17.6l2.13,5.47,2.59,6.64h7.12l-2.59-6.64ZM220.69,153.45l3.05-7.83,3.16-8.11,3.16,8.11,3.05,7.83h-12.42Z\"/>\n\t\t\t\t\t\t<polygon fill=\"#000\" points=\"127.24 127.81 123.3 134.45 116.67 145.62 112.61 152.46 112.56 152.54 112.56 172.19 104.86 172.19 104.86 152.41 100.82 145.62 94.2 134.45 90.25 127.81 97.98 127.81 101.92 134.45 104.86 139.4 108.55 145.62 108.75 145.95 108.95 145.62 112.56 139.53 115.58 134.45 119.52 127.81 127.24 127.81\"/>\n\t\t\t\t\t\t<polygon fill=\"#000\" points=\"143.6 134.45 143.6 145.62 161.45 145.62 161.45 152.25 143.6 152.25 143.6 165.55 164.23 165.55 164.23 172.19 136.96 172.19 136.96 127.81 164.23 127.81 164.23 134.45 143.6 134.45\"/>\n\t\t\t\t\t</g>\n\t\t\t\t</svg>\n\t\t\t\t<span class=\"dx-text\">dx</span>\n\t\t\t</div>\n\t\t\t<div class=\"loading-text\">Loading Experience</div>\n\t\t\t<div class=\"loading-bar\">\n\t\t\t\t<div class=\"loading-progress\"></div>\n\t\t\t</div>\n\t\t</div>\n\t\t\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t\t\n\t\t<script>\n\t\t\t// Remove loading screen when app is ready\n\t\t\tif (typeof window !== 'undefined') {\n\t\t\t\twindow.addEventListener('load', () => {\n\t\t\t\t\tsetTimeout(() => {\n\t\t\t\t\t\tconst loader = document.getElementById('zyeta-loading');\n\t\t\t\t\t\tif (loader) {\n\t\t\t\t\t\t\tloader.classList.add('fade-out');\n\t\t\t\t\t\t\tsetTimeout(() => loader.remove(), 500);\n\t\t\t\t\t\t}\n\t\t\t\t\t}, 500);\n\t\t\t\t});\n\t\t\t}\n\t\t</script>\n\t</body>\n</html>\n",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "tgbxrz"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	({ handle, handleFetch, handleError, handleValidationError, init } = await import("../../../src/hooks.server.ts"));

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
