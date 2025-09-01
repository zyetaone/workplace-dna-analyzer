export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12')
];

export const server_loads = [];

export const dictionary = {
		"/": [~3],
		"/admin": [~10,[2]],
		"/admin/[code]": [~11,[2]],
		"/example-quiz": [~12],
		"/(participant)/[code]": [~4],
		"/(participant)/[code]/activities": [~5],
		"/(participant)/[code]/activity/[activitySlug]": [~6],
		"/(participant)/[code]/activity/[activitySlug]/results": [7],
		"/(participant)/[code]/complete": [8],
		"/(participant)/[code]/quiz": [9]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';