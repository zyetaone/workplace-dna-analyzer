import { render, type RenderOptions } from '@testing-library/svelte';
import { vi } from 'vitest';

// Custom render function with common providers
export function customRender(
	component: any,
	props: Record<string, any> = {},
	options: Omit<RenderOptions, 'props'> = {}
) {
	return render(component, props, {
		...options
		// Add any global context providers here if needed
	});
}

// Re-export everything from testing library
export * from '@testing-library/svelte';

// Mock utilities
export const mockPage = (params = { code: 'TEST123' }) => ({
	params,
	url: new URL('http://localhost:5173/TEST123')
});

export const mockParticipant = {
	id: 'test-participant-id',
	name: 'Test User',
	email: 'test@example.com',
	createdAt: new Date(),
	sessionId: 'test-session-id'
};

export const mockSession = {
	id: 'test-session-id',
	code: 'TEST123',
	title: 'Test Session',
	createdAt: new Date(),
	updatedAt: new Date()
};

// Common test data
export const mockQuizOptions = [
	{ id: 'option1', label: 'Option 1', description: 'First option' },
	{ id: 'option2', label: 'Option 2', description: 'Second option' },
	{ id: 'option3', label: 'Option 3', description: 'Third option' }
];

export const mockChartData = [
	{ label: 'Category A', value: 30, color: '#a855f7' },
	{ label: 'Category B', value: 25, color: '#ec4899' },
	{ label: 'Category C', value: 45, color: '#3b82f6' }
];

// Performance testing utilities
export const measureRenderTime = async (component: any, props = {}) => {
	const startTime = performance.now();
	const { container } = customRender(component, props);
	await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for next tick
	const endTime = performance.now();
	return {
		renderTime: endTime - startTime,
		container
	};
};

// Memory leak detection
export const detectMemoryLeaks = (component: any, props = {}) => {
	// Note: performance.memory is not available in all environments
	const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

	// Render component
	const { unmount } = customRender(component, props);

	// Force garbage collection if available
	if ((global as any).gc) {
		(global as any).gc();
	}

	// Wait for cleanup
	return new Promise((resolve) => {
		setTimeout(() => {
			const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
			const memoryDelta = finalMemory - initialMemory;

			unmount();
			resolve({
				memoryDelta,
				leaked: memoryDelta > 10000 // 10KB threshold
			});
		}, 100);
	});
};

// Accessibility testing helpers
export const checkAccessibility = (container: HTMLElement) => {
	const issues: string[] = [];

	// Check for missing alt text
	const images = container.querySelectorAll('img');
	images.forEach((img) => {
		if (!img.alt && !img.hasAttribute('aria-hidden')) {
			issues.push(`Image missing alt text: ${img.src}`);
		}
	});

	// Check for missing labels
	const inputs = container.querySelectorAll('input, select, textarea');
	inputs.forEach((input) => {
		const label = container.querySelector(`label[for="${input.id}"]`);
		if (!label && !input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
			const identifier = (input as HTMLInputElement).name || input.id || 'unknown';
			issues.push(`Input missing label: ${identifier}`);
		}
	});

	// Check for missing button text
	const buttons = container.querySelectorAll('button');
	buttons.forEach((button) => {
		if (!button.textContent?.trim() && !button.hasAttribute('aria-label')) {
			issues.push('Button missing accessible text');
		}
	});

	return issues;
};

// Animation testing helpers
export const waitForAnimation = (element: HTMLElement, animationName: string) => {
	return new Promise<boolean>((resolve) => {
		const handleAnimationEnd = (event: AnimationEvent) => {
			if (event.animationName === animationName) {
				element.removeEventListener('animationend', handleAnimationEnd);
				resolve(true);
			}
		};
		element.addEventListener('animationend', handleAnimationEnd);

		// Timeout fallback
		setTimeout(() => {
			element.removeEventListener('animationend', handleAnimationEnd);
			resolve(false);
		}, 1000);
	});
};

// Mock implementations for common dependencies
const createMockSelection = () => ({
	attr: vi.fn().mockReturnThis(),
	style: vi.fn().mockReturnThis(),
	text: vi.fn().mockReturnThis(),
	on: vi.fn().mockReturnThis(),
	data: vi.fn(() => ({
		enter: vi.fn(() => ({
			append: vi.fn(() => createMockSelection())
		}))
	})),
	centroid: vi.fn(() => [50, 50])
});

export const mockD3 = {
	select: vi.fn(() => createMockSelection()),
	selectAll: vi.fn(() => createMockSelection()),
	scaleOrdinal: vi.fn(() => vi.fn(() => '#a855f7')),
	pie: vi.fn(() =>
		vi.fn((data: any[]) => data.map((d, i) => ({ data: d, value: d.value, index: i })))
	),
	arc: vi.fn(() => vi.fn(() => 'M0,0 L10,10 A5,5 0 0,1 0,0 Z'))
};
