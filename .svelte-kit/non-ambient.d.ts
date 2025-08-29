
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
		RouteId(): "/(components)" | "/" | "/admin/(components)" | "/admin" | "/admin/[code]/(components)" | "/admin/[code]" | "/[code]" | "/[code]/complete" | "/[code]/quiz";
		RouteParams(): {
			"/admin/[code]/(components)": { code: string };
			"/admin/[code]": { code: string };
			"/[code]": { code: string };
			"/[code]/complete": { code: string };
			"/[code]/quiz": { code: string }
		};
		LayoutParams(): {
			"/(components)": Record<string, never>;
			"/": { code?: string };
			"/admin/(components)": Record<string, never>;
			"/admin": { code?: string };
			"/admin/[code]/(components)": { code: string };
			"/admin/[code]": { code: string };
			"/[code]": { code: string };
			"/[code]/complete": { code: string };
			"/[code]/quiz": { code: string }
		};
		Pathname(): "/" | "/admin" | "/admin/" | `/admin/${string}` & {} | `/admin/${string}/` & {} | `/${string}` & {} | `/${string}/` & {} | `/${string}/complete` & {} | `/${string}/complete/` & {} | `/${string}/quiz` & {} | `/${string}/quiz/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.well-known/appspecific/com.chrome.devtools.json" | "/Zyeta_Black_SVG.svg" | "/architectural-bg.svg" | "/favicon-128x128.png" | "/favicon-16x16.png" | "/favicon-256x256.png" | "/favicon-32x32.png" | "/favicon-48x48.png" | "/favicon-64x64.png" | "/favicon.ico" | "/favicon.svg" | "/robots.txt" | "/zyeta-dx-logo.svg" | string & {};
	}
}