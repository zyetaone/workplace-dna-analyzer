import { fly, fade, scale, slide, blur } from 'svelte/transition';
import { cubicInOut, cubicOut, elasticOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/**
 * Bits UI Transition Utilities
 * Reusable transition configurations to reduce duplication
 */

// Modal/Dialog Transitions
export const modalTransition = {
	overlay: {
		in: (node: Element) => fade(node, { duration: 200 }),
		out: (node: Element) => fade(node, { duration: 150 })
	},
	content: {
		in: (node: Element) => scale(node, { 
			duration: 200, 
			start: 0.95,
			easing: cubicOut 
		}),
		out: (node: Element) => scale(node, { 
			duration: 150, 
			start: 0.95,
			easing: cubicInOut 
		})
	}
};

// Dropdown/Select Transitions
export const dropdownTransition = {
	in: (node: Element) => fly(node, { 
		y: -10, 
		duration: 150,
		easing: cubicOut 
	}),
	out: (node: Element) => fly(node, { 
		y: -10, 
		duration: 100,
		easing: cubicInOut 
	})
};

// Tooltip Transitions
export const tooltipTransition = {
	in: (node: Element) => fade(node, { 
		duration: 100,
		delay: 500 // Delay before showing
	}),
	out: (node: Element) => fade(node, { 
		duration: 50 
	})
};

// Accordion/Collapsible Transitions
export const accordionTransition = {
	in: (node: Element) => slide(node, { 
		duration: 200,
		easing: cubicOut 
	}),
	out: (node: Element) => slide(node, { 
		duration: 150,
		easing: cubicInOut 
	})
};

// Tab Content Transitions
export const tabTransition = {
	in: (node: Element) => fade(node, { 
		duration: 150,
		delay: 150 
	}),
	out: (node: Element) => fade(node, { 
		duration: 100 
	})
};

// Toast/Notification Transitions
export const toastTransition = {
	in: (node: Element) => fly(node, { 
		x: 100, 
		duration: 300,
		easing: elasticOut 
	}),
	out: (node: Element) => fly(node, { 
		x: 100, 
		duration: 200,
		easing: cubicInOut 
	})
};

// Loading/Skeleton Transitions
export const shimmerTransition = {
	in: (node: Element) => blur(node, { 
		amount: '5px',
		duration: 300 
	}),
	out: (node: Element) => blur(node, { 
		amount: '5px',
		duration: 200 
	})
};

// Page/Route Transitions
export const pageTransition = {
	in: (node: Element) => fly(node, { 
		x: -20, 
		duration: 300,
		easing: cubicOut 
	}),
	out: (node: Element) => fly(node, { 
		x: 20, 
		duration: 200,
		easing: cubicInOut 
	})
};

// Card Hover Transition (CSS-based)
export const cardHoverClass = 'transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl';

// Button Press Transition (CSS-based)
export const buttonPressClass = 'transition-all duration-150 active:scale-95';

// Input Focus Transition (CSS-based)
export const inputFocusClass = 'transition-all duration-200 focus:ring-2 focus:ring-offset-2';

/**
 * Utility function to apply transitions conditionally
 */
export function applyTransition(
	node: Element, 
	show: boolean, 
	transitions: { in: Function, out: Function }
): TransitionConfig | undefined {
	return show ? transitions.in(node) : transitions.out(node);
}

/**
 * Presets for common animation scenarios
 */
export const transitionPresets = {
	// Quick feedback animations
	instant: { duration: 50 },
	fast: { duration: 150 },
	normal: { duration: 300 },
	slow: { duration: 500 },
	
	// Easing presets
	smooth: { easing: cubicInOut },
	snappy: { easing: cubicOut },
	bouncy: { easing: elasticOut },
	
	// Common combinations
	fadeInUp: { y: 20, duration: 300, easing: cubicOut },
	fadeInDown: { y: -20, duration: 300, easing: cubicOut },
	scaleIn: { start: 0.9, duration: 200, easing: cubicOut },
	slideRight: { x: -100, duration: 300, easing: cubicOut }
};