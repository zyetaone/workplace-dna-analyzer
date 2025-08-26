
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/ai" | "/api/ai/chat" | "/api/ai/render" | "/api/sessions" | "/api/sessions/[id]" | "/api/sessions/[id]/stream" | "/api/test-session" | "/health" | "/join" | "/session" | "/session/[sessionId]" | "/session/[sessionId]/attendee" | "/session/[sessionId]/attendee/[attendeeId]" | "/session/[sessionId]/attendee/[attendeeId]/complete" | "/session/[sessionId]/join" | "/session/[sessionId]/presenter" | "/test-stores";
		RouteParams(): {
			"/api/sessions/[id]": { id: string };
			"/api/sessions/[id]/stream": { id: string };
			"/session/[sessionId]": { sessionId: string };
			"/session/[sessionId]/attendee": { sessionId: string };
			"/session/[sessionId]/attendee/[attendeeId]": { sessionId: string; attendeeId: string };
			"/session/[sessionId]/attendee/[attendeeId]/complete": { sessionId: string; attendeeId: string };
			"/session/[sessionId]/join": { sessionId: string };
			"/session/[sessionId]/presenter": { sessionId: string }
		};
		LayoutParams(): {
			"/": { id?: string; sessionId?: string; attendeeId?: string };
			"/api": { id?: string };
			"/api/ai": Record<string, never>;
			"/api/ai/chat": Record<string, never>;
			"/api/ai/render": Record<string, never>;
			"/api/sessions": { id?: string };
			"/api/sessions/[id]": { id: string };
			"/api/sessions/[id]/stream": { id: string };
			"/api/test-session": Record<string, never>;
			"/health": Record<string, never>;
			"/join": Record<string, never>;
			"/session": { sessionId?: string; attendeeId?: string };
			"/session/[sessionId]": { sessionId: string; attendeeId?: string };
			"/session/[sessionId]/attendee": { sessionId: string; attendeeId?: string };
			"/session/[sessionId]/attendee/[attendeeId]": { sessionId: string; attendeeId: string };
			"/session/[sessionId]/attendee/[attendeeId]/complete": { sessionId: string; attendeeId: string };
			"/session/[sessionId]/join": { sessionId: string };
			"/session/[sessionId]/presenter": { sessionId: string };
			"/test-stores": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/ai" | "/api/ai/" | "/api/ai/chat" | "/api/ai/chat/" | "/api/ai/render" | "/api/ai/render/" | "/api/sessions" | "/api/sessions/" | `/api/sessions/${string}` & {} | `/api/sessions/${string}/` & {} | `/api/sessions/${string}/stream` & {} | `/api/sessions/${string}/stream/` & {} | "/api/test-session" | "/api/test-session/" | "/health" | "/health/" | "/join" | "/join/" | "/session" | "/session/" | `/session/${string}` & {} | `/session/${string}/` & {} | `/session/${string}/attendee` & {} | `/session/${string}/attendee/` & {} | `/session/${string}/attendee/${string}` & {} | `/session/${string}/attendee/${string}/` & {} | `/session/${string}/attendee/${string}/complete` & {} | `/session/${string}/attendee/${string}/complete/` & {} | `/session/${string}/join` & {} | `/session/${string}/join/` & {} | `/session/${string}/presenter` & {} | `/session/${string}/presenter/` & {} | "/test-stores" | "/test-stores/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/Zyeta_Black_SVG.svg" | "/favicon.svg" | "/robots.txt" | "/zyeta-dx-logo.svg" | string & {};
	}
}