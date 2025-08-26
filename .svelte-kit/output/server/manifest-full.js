export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["Zyeta_Black_SVG.svg","favicon.svg","robots.txt","zyeta-dx-logo.svg"]),
	mimeTypes: {".svg":"image/svg+xml",".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.BB1HYFtn.js",app:"_app/immutable/entry/app.C_IOHzZR.js",imports:["_app/immutable/entry/start.BB1HYFtn.js","_app/immutable/chunks/BXtNqw99.js","_app/immutable/chunks/oQ9KHoCl.js","_app/immutable/entry/app.C_IOHzZR.js","_app/immutable/chunks/C3uLMBMe.js","_app/immutable/chunks/oQ9KHoCl.js","_app/immutable/chunks/CM4y3QyB.js","_app/immutable/chunks/B6Yvxf5m.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js'))
		],
		remotes: {
			'1vxpwt5': __memo(() => import('./remote/1vxpwt5.js')),
			'c3ww8i': __memo(() => import('./remote/c3ww8i.js')),
			'xu03kg': __memo(() => import('./remote/xu03kg.js'))
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/ai/chat",
				pattern: /^\/api\/ai\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/chat/_server.ts.js'))
			},
			{
				id: "/api/ai/render",
				pattern: /^\/api\/ai\/render\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ai/render/_server.ts.js'))
			},
			{
				id: "/api/sessions/[id]/stream",
				pattern: /^\/api\/sessions\/([^/]+?)\/stream\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/sessions/_id_/stream/_server.ts.js'))
			},
			{
				id: "/api/test-session",
				pattern: /^\/api\/test-session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/test-session/_server.ts.js'))
			},
			{
				id: "/join",
				pattern: /^\/join\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/session/[sessionId]/attendee/[attendeeId]",
				pattern: /^\/session\/([^/]+?)\/attendee\/([^/]+?)\/?$/,
				params: [{"name":"sessionId","optional":false,"rest":false,"chained":false},{"name":"attendeeId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/session/[sessionId]/attendee/[attendeeId]/complete",
				pattern: /^\/session\/([^/]+?)\/attendee\/([^/]+?)\/complete\/?$/,
				params: [{"name":"sessionId","optional":false,"rest":false,"chained":false},{"name":"attendeeId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/session/[sessionId]/join",
				pattern: /^\/session\/([^/]+?)\/join\/?$/,
				params: [{"name":"sessionId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/session/[sessionId]/presenter",
				pattern: /^\/session\/([^/]+?)\/presenter\/?$/,
				params: [{"name":"sessionId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/test-stores",
				pattern: /^\/test-stores\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
