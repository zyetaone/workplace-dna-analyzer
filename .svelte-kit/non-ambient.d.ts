
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
		RouteId(): "/(participant)" | "/" | "/(participant)/activities" | "/(participant)/activities/activities" | "/admin/(components)" | "/admin" | "/admin/[code]" | "/example-quiz" | "/(participant)/[code]" | "/(participant)/[code]/activities" | "/(participant)/[code]/activity" | "/(participant)/[code]/activity/[activitySlug]" | "/(participant)/[code]/activity/[activitySlug]/results" | "/(participant)/[code]/complete" | "/(participant)/[code]/quiz";
		RouteParams(): {
			"/admin/[code]": { code: string };
			"/(participant)/[code]": { code: string };
			"/(participant)/[code]/activities": { code: string };
			"/(participant)/[code]/activity": { code: string };
			"/(participant)/[code]/activity/[activitySlug]": { code: string; activitySlug: string };
			"/(participant)/[code]/activity/[activitySlug]/results": { code: string; activitySlug: string };
			"/(participant)/[code]/complete": { code: string };
			"/(participant)/[code]/quiz": { code: string }
		};
		LayoutParams(): {
			"/(participant)": { code?: string; activitySlug?: string };
			"/": { code?: string; activitySlug?: string };
			"/(participant)/activities": Record<string, never>;
			"/(participant)/activities/activities": Record<string, never>;
			"/admin/(components)": Record<string, never>;
			"/admin": { code?: string };
			"/admin/[code]": { code: string };
			"/example-quiz": Record<string, never>;
			"/(participant)/[code]": { code: string; activitySlug?: string };
			"/(participant)/[code]/activities": { code: string };
			"/(participant)/[code]/activity": { code: string; activitySlug?: string };
			"/(participant)/[code]/activity/[activitySlug]": { code: string; activitySlug: string };
			"/(participant)/[code]/activity/[activitySlug]/results": { code: string; activitySlug: string };
			"/(participant)/[code]/complete": { code: string };
			"/(participant)/[code]/quiz": { code: string }
		};
		Pathname(): "/" | "/activities" | "/activities/" | "/activities/activities" | "/activities/activities/" | "/admin" | "/admin/" | `/admin/${string}` & {} | `/admin/${string}/` & {} | "/example-quiz" | "/example-quiz/" | `/${string}` & {} | `/${string}/` & {} | `/${string}/activities` & {} | `/${string}/activities/` & {} | `/${string}/activity` & {} | `/${string}/activity/` & {} | `/${string}/activity/${string}` & {} | `/${string}/activity/${string}/` & {} | `/${string}/activity/${string}/results` & {} | `/${string}/activity/${string}/results/` & {} | `/${string}/complete` & {} | `/${string}/complete/` & {} | `/${string}/quiz` & {} | `/${string}/quiz/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.well-known/appspecific/com.chrome.devtools.json" | "/Zyeta_Black_SVG.svg" | "/architectural-bg.svg" | "/favicon-128x128.png" | "/favicon-16x16.png" | "/favicon-256x256.png" | "/favicon-32x32.png" | "/favicon-48x48.png" | "/favicon-64x64.png" | "/favicon.ico" | "/favicon.svg" | "/robots.txt" | "/zyeta-dx-logo.svg" | string & {};
	}
}