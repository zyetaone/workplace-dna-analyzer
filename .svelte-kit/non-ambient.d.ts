
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
		RouteId(): "/" | "/admin" | "/admin/components" | "/admin/[code]" | "/landing" | "/[code]" | "/[code]/complete" | "/[code]/components" | "/[code]/quiz" | "/[code]/quiz/complete" | "/[code]/quiz/components";
		RouteParams(): {
			"/admin/[code]": { code: string };
			"/[code]": { code: string };
			"/[code]/complete": { code: string };
			"/[code]/components": { code: string };
			"/[code]/quiz": { code: string };
			"/[code]/quiz/complete": { code: string };
			"/[code]/quiz/components": { code: string }
		};
		LayoutParams(): {
			"/": { code?: string };
			"/admin": { code?: string };
			"/admin/components": Record<string, never>;
			"/admin/[code]": { code: string };
			"/landing": Record<string, never>;
			"/[code]": { code: string };
			"/[code]/complete": { code: string };
			"/[code]/components": { code: string };
			"/[code]/quiz": { code: string };
			"/[code]/quiz/complete": { code: string };
			"/[code]/quiz/components": { code: string }
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/admin/components" | "/admin/components/" | `/admin/${string}` & {} | `/admin/${string}/` & {} | "/landing" | "/landing/" | `/${string}` & {} | `/${string}/` & {} | `/${string}/complete` & {} | `/${string}/complete/` & {} | `/${string}/components` & {} | `/${string}/components/` & {} | `/${string}/quiz` & {} | `/${string}/quiz/` & {} | `/${string}/quiz/complete` & {} | `/${string}/quiz/complete/` & {} | `/${string}/quiz/components` & {} | `/${string}/quiz/components/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.well-known/appspecific/com.chrome.devtools.json" | "/Zyeta_Black_SVG.svg" | "/favicon.svg" | "/robots.txt" | "/zyeta-dx-logo.svg" | string & {};
	}
}