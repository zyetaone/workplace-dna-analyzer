
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
		RouteId(): "/" | "/dashboard" | "/dashboard/[slug]" | "/dashboard/[slug]/join" | "/dashboard/[slug]/p" | "/dashboard/[slug]/p/[id]" | "/dashboard/[slug]/p/[id]/quiz" | "/dashboard/[slug]/p/[id]/quiz/complete";
		RouteParams(): {
			"/dashboard/[slug]": { slug: string };
			"/dashboard/[slug]/join": { slug: string };
			"/dashboard/[slug]/p": { slug: string };
			"/dashboard/[slug]/p/[id]": { slug: string; id: string };
			"/dashboard/[slug]/p/[id]/quiz": { slug: string; id: string };
			"/dashboard/[slug]/p/[id]/quiz/complete": { slug: string; id: string }
		};
		LayoutParams(): {
			"/": { slug?: string; id?: string };
			"/dashboard": { slug?: string; id?: string };
			"/dashboard/[slug]": { slug: string; id?: string };
			"/dashboard/[slug]/join": { slug: string };
			"/dashboard/[slug]/p": { slug: string; id?: string };
			"/dashboard/[slug]/p/[id]": { slug: string; id: string };
			"/dashboard/[slug]/p/[id]/quiz": { slug: string; id: string };
			"/dashboard/[slug]/p/[id]/quiz/complete": { slug: string; id: string }
		};
		Pathname(): "/" | "/dashboard" | "/dashboard/" | `/dashboard/${string}` & {} | `/dashboard/${string}/` & {} | `/dashboard/${string}/join` & {} | `/dashboard/${string}/join/` & {} | `/dashboard/${string}/p` & {} | `/dashboard/${string}/p/` & {} | `/dashboard/${string}/p/${string}` & {} | `/dashboard/${string}/p/${string}/` & {} | `/dashboard/${string}/p/${string}/quiz` & {} | `/dashboard/${string}/p/${string}/quiz/` & {} | `/dashboard/${string}/p/${string}/quiz/complete` & {} | `/dashboard/${string}/p/${string}/quiz/complete/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/Zyeta_Black_SVG.svg" | "/favicon.svg" | "/robots.txt" | "/zyeta-dx-logo.svg" | string & {};
	}
}