
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
		RouteId(): "/" | "/session" | "/session/[slug]" | "/session/[slug]/attendee" | "/session/[slug]/attendee/[attendeeId]" | "/session/[slug]/attendee/[attendeeId]/complete" | "/session/[slug]/join" | "/session/[slug]/presenter" | "/session/[slug]/stream";
		RouteParams(): {
			"/session/[slug]": { slug: string };
			"/session/[slug]/attendee": { slug: string };
			"/session/[slug]/attendee/[attendeeId]": { slug: string; attendeeId: string };
			"/session/[slug]/attendee/[attendeeId]/complete": { slug: string; attendeeId: string };
			"/session/[slug]/join": { slug: string };
			"/session/[slug]/presenter": { slug: string };
			"/session/[slug]/stream": { slug: string }
		};
		LayoutParams(): {
			"/": { slug?: string; attendeeId?: string };
			"/session": { slug?: string; attendeeId?: string };
			"/session/[slug]": { slug: string; attendeeId?: string };
			"/session/[slug]/attendee": { slug: string; attendeeId?: string };
			"/session/[slug]/attendee/[attendeeId]": { slug: string; attendeeId: string };
			"/session/[slug]/attendee/[attendeeId]/complete": { slug: string; attendeeId: string };
			"/session/[slug]/join": { slug: string };
			"/session/[slug]/presenter": { slug: string };
			"/session/[slug]/stream": { slug: string }
		};
		Pathname(): "/" | "/session" | "/session/" | `/session/${string}` & {} | `/session/${string}/` & {} | `/session/${string}/attendee` & {} | `/session/${string}/attendee/` & {} | `/session/${string}/attendee/${string}` & {} | `/session/${string}/attendee/${string}/` & {} | `/session/${string}/attendee/${string}/complete` & {} | `/session/${string}/attendee/${string}/complete/` & {} | `/session/${string}/join` & {} | `/session/${string}/join/` & {} | `/session/${string}/presenter` & {} | `/session/${string}/presenter/` & {} | `/session/${string}/stream` & {} | `/session/${string}/stream/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/Zyeta_Black_SVG.svg" | "/favicon.svg" | "/robots.txt" | "/zyeta-dx-logo.svg" | string & {};
	}
}