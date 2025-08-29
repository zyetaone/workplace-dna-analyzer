import { mergeProps as bitsUImergeProps } from 'bits-ui';

/**
 * Re-export mergeProps from bits-ui for consistent usage
 * This utility merges multiple prop objects, handling event handlers properly
 */
export const mergeProps = bitsUImergeProps;

/**
 * Alternative merge implementation if needed
 */
export function mergePropsFallback(...args: any[]) {
	const result: Record<string, any> = {};
	
	for (const props of args) {
		for (const key in props) {
			const val = props[key];
			
			// Handle event handlers (onclick, onmouseenter, etc.)
			if (key.startsWith('on') && typeof result[key] === 'function' && typeof val === 'function') {
				const existing = result[key];
				result[key] = (...args: any[]) => {
					existing(...args);
					val(...args);
				};
			}
			// Handle class names
			else if (key === 'class' || key === 'className') {
				const existing = result[key];
				result[key] = existing ? `${existing} ${val}` : val;
			}
			// Handle styles
			else if (key === 'style') {
				const existing = result[key];
				if (typeof existing === 'object' && typeof val === 'object') {
					result[key] = { ...existing, ...val };
				} else {
					result[key] = val;
				}
			}
			// Default: override
			else {
				result[key] = val;
			}
		}
	}
	
	return result;
}